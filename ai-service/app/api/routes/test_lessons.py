"""Tests for the lesson generation route."""
import pytest
from app.api.routes.lessons import (
    LESSON_PROMPT,
    GenerateLessonRequest,
    GenerateLessonResponse,
)


class TestLessonPrompt:
    def test_contains_required_placeholders(self):
        assert "{topic}" in LESSON_PROMPT
        assert "{difficulty}" in LESSON_PROMPT
        assert "{goal_line}" in LESSON_PROMPT

    def test_formats_correctly(self):
        formatted = LESSON_PROMPT.format(
            topic="Recursion",
            difficulty="beginner",
            goal_line="Learning goal: Understand base cases",
        )
        assert "Recursion" in formatted
        assert "beginner" in formatted
        assert "Learning goal: Understand base cases" in formatted

    def test_requests_json_output(self):
        assert "JSON" in LESSON_PROMPT

    def test_specifies_required_fields(self):
        for field in ("title", "summary", "sections", "keyTakeaways", "estimatedReadMinutes"):
            assert field in LESSON_PROMPT


class TestGenerateLessonRequest:
    def test_defaults(self):
        req = GenerateLessonRequest(
            lessonId="l1",
            studentId="s1",
            topic="Trees",
            difficulty="beginner",
        )
        assert req.documentIds == []
        assert req.learningGoal is None
        assert req.studentContext == {}

    def test_optional_learning_goal(self):
        req = GenerateLessonRequest(
            lessonId="l1",
            studentId="s1",
            topic="Trees",
            difficulty="intermediate",
            learningGoal="Understand AVL rotations",
        )
        assert req.learningGoal == "Understand AVL rotations"

    def test_goal_line_is_empty_when_no_goal(self):
        goal_line = ""
        formatted = LESSON_PROMPT.format(topic="X", difficulty="beginner", goal_line=goal_line)
        assert "Learning goal:" not in formatted

    def test_goal_line_appears_when_goal_provided(self):
        goal = "Master the concept"
        goal_line = f"Learning goal: {goal}" if goal else ""
        formatted = LESSON_PROMPT.format(topic="X", difficulty="beginner", goal_line=goal_line)
        assert "Master the concept" in formatted


class TestGenerateLessonResponse:
    def test_parses_valid_response(self):
        resp = GenerateLessonResponse(
            title="Introduction to Recursion",
            summary="Recursion is when a function calls itself.",
            sections=[{"heading": "Base Case", "content": "...", "keyPoints": ["p1"], "codeExample": None}],
            keyTakeaways=["k1", "k2", "k3", "k4", "k5"],
            estimatedReadMinutes=8,
        )
        assert resp.title == "Introduction to Recursion"
        assert resp.estimatedReadMinutes == 8
        assert len(resp.keyTakeaways) == 5

    def test_sections_can_include_code_example(self):
        resp = GenerateLessonResponse(
            title="Python Decorators",
            summary="...",
            sections=[{"heading": "Usage", "content": "...", "keyPoints": [], "codeExample": "@functools.wraps(fn)"}],
            keyTakeaways=["k1"],
            estimatedReadMinutes=5,
        )
        assert resp.sections[0]["codeExample"] == "@functools.wraps(fn)"
