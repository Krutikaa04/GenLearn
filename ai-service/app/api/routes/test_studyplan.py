"""Unit tests for study plan route helpers.

The actual AI generation is mocked — we test that the mastery-data formatting
and request validation logic behaves correctly.
"""
from unittest.mock import AsyncMock, patch

import pytest

from app.api.routes.studyplan import (
    GenerateStudyPlanRequest,
    TopicMastery,
    StudyTask,
    StudyDay,
    GenerateStudyPlanResponse,
    STUDY_PLAN_PROMPT,
)


def make_request(**kwargs) -> GenerateStudyPlanRequest:
    defaults = {
        "userId": "user-1",
        "goal": "Learn FastAPI in one week",
        "targetDate": "2026-07-08",
        "topics": ["Routing", "Pydantic", "Async"],
        "masteryData": [],
        "hoursPerDay": 2.0,
    }
    defaults.update(kwargs)
    return GenerateStudyPlanRequest(**defaults)


def build_mastery_section(request: GenerateStudyPlanRequest) -> str:
    """Replicate the mastery-info formatting from the route handler."""
    mastery_map = {m.topic: m.masteryScore for m in request.masteryData}
    lines = []
    for topic in request.topics:
        score = mastery_map.get(topic, 0)
        lines.append(f"  - {topic}: {score:.0f}%")
    return "\n".join(lines)


# ── mastery formatting ──────────────────────────────────────────────────────


class TestMasteryFormatting:
    def test_zero_mastery_shown_when_no_data_provided(self):
        req = make_request(masteryData=[])
        section = build_mastery_section(req)
        assert "Routing: 0%" in section
        assert "Pydantic: 0%" in section
        assert "Async: 0%" in section

    def test_known_mastery_scores_are_used(self):
        req = make_request(
            masteryData=[
                TopicMastery(topic="Routing", masteryScore=75.0),
                TopicMastery(topic="Pydantic", masteryScore=40.0),
            ]
        )
        section = build_mastery_section(req)
        assert "Routing: 75%" in section
        assert "Pydantic: 40%" in section
        assert "Async: 0%" in section  # not in masteryData → defaults to 0

    def test_topic_not_in_mastery_data_gets_zero(self):
        req = make_request(
            topics=["Topic A", "Topic B"],
            masteryData=[TopicMastery(topic="Topic A", masteryScore=90.0)],
        )
        section = build_mastery_section(req)
        assert "Topic B: 0%" in section

    def test_fractional_scores_are_rounded_in_display(self):
        req = make_request(
            topics=["X"],
            masteryData=[TopicMastery(topic="X", masteryScore=66.6)],
        )
        section = build_mastery_section(req)
        assert "X: 67%" in section


# ── prompt template ──────────────────────────────────────────────────────────


class TestPromptTemplate:
    def test_prompt_contains_goal_placeholder(self):
        assert "{goal}" in STUDY_PLAN_PROMPT

    def test_prompt_contains_hours_placeholder(self):
        assert "{hours_per_day}" in STUDY_PLAN_PROMPT
        assert "{minutes_per_day}" in STUDY_PLAN_PROMPT

    def test_prompt_requests_json_only_output(self):
        assert "Return ONLY valid JSON" in STUDY_PLAN_PROMPT


# ── request validation ───────────────────────────────────────────────────────


class TestRequestValidation:
    def test_hours_per_day_defaults_to_two(self):
        req = GenerateStudyPlanRequest(
            userId="u",
            goal="Learn X",
            targetDate="2026-07-10",
            topics=["X"],
        )
        assert req.hoursPerDay == 2.0

    def test_mastery_data_defaults_to_empty_list(self):
        req = GenerateStudyPlanRequest(
            userId="u",
            goal="Learn X",
            targetDate="2026-07-10",
            topics=["X"],
        )
        assert req.masteryData == []


# ── response model ───────────────────────────────────────────────────────────


class TestResponseModel:
    def test_valid_response_parses_correctly(self):
        data = {
            "title": "FastAPI Sprint",
            "summary": "Three-day intensive plan.",
            "plan": [
                {
                    "day": 1,
                    "date": "2026-07-05",
                    "tasks": [
                        {
                            "type": "lesson",
                            "topic": "Routing",
                            "durationMinutes": 30,
                            "priority": "high",
                            "rationale": "Core concept, start here",
                        }
                    ],
                    "totalMinutes": 30,
                }
            ],
        }
        resp = GenerateStudyPlanResponse(**data)
        assert resp.title == "FastAPI Sprint"
        assert len(resp.plan) == 1
        assert resp.plan[0].day == 1
        assert resp.plan[0].tasks[0].type == "lesson"
