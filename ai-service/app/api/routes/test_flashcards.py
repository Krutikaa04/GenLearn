"""Tests for the flashcard generation route."""
import pytest
from app.api.routes.flashcards import (
    FLASHCARD_PROMPT,
    GenerateFlashcardsRequest,
    GenerateFlashcardsResponse,
    _get_context,
)


class TestFlashcardPrompt:
    def test_prompt_contains_count_placeholder(self):
        assert "{count}" in FLASHCARD_PROMPT

    def test_prompt_contains_context_placeholder(self):
        assert "{context}" in FLASHCARD_PROMPT

    def test_prompt_formatted_with_values(self):
        formatted = FLASHCARD_PROMPT.format(count=10, context="Some lecture content")
        assert "10" in formatted
        assert "Some lecture content" in formatted
        assert "{count}" not in formatted
        assert "{context}" not in formatted

    def test_prompt_requests_json_output(self):
        assert "JSON" in FLASHCARD_PROMPT

    def test_prompt_specifies_front_back_hint_fields(self):
        assert "front" in FLASHCARD_PROMPT
        assert "back" in FLASHCARD_PROMPT
        assert "hint" in FLASHCARD_PROMPT


class TestGenerateFlashcardsRequest:
    def test_defaults(self):
        req = GenerateFlashcardsRequest(
            setId="set-1",
            studentId="student-1",
            sourceType="document",
            sourceId="doc-1",
        )
        assert req.count == 15
        assert req.content is None
        assert req.topic is None

    def test_explicit_count_and_content(self):
        req = GenerateFlashcardsRequest(
            setId="set-1",
            studentId="student-1",
            sourceType="lesson",
            sourceId="lesson-1",
            count=5,
            content="Lesson text here",
        )
        assert req.count == 5
        assert req.content == "Lesson text here"


class TestGenerateFlashcardsResponse:
    def test_valid_response_parses(self):
        cards = [
            {"cardId": "c1", "front": "What is X?", "back": "X is Y", "hint": None},
        ]
        resp = GenerateFlashcardsResponse(cards=cards)
        assert len(resp.cards) == 1
        assert resp.cards[0]["front"] == "What is X?"

    def test_empty_card_list(self):
        resp = GenerateFlashcardsResponse(cards=[])
        assert resp.cards == []


class TestGetContext:
    @pytest.mark.asyncio
    async def test_returns_empty_string_for_unknown_source_type(self):
        result = await _get_context("unknown_type", "some-id", None)
        assert result == ""

    @pytest.mark.asyncio
    async def test_lesson_source_handles_missing_lesson(self):
        class MockDb(dict):
            def __getitem__(self, key):
                class MockCollection:
                    async def find_one(self, *args, **kwargs):
                        return None
                return MockCollection()

        result = await _get_context("lesson", "missing-id", MockDb())
        assert result == ""
