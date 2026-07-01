"""Tests for the tutor route — prompt construction and response model."""
import pytest
from app.api.routes.tutor import SYSTEM_PROMPT, TutorChatRequest, TutorChatResponse


class TestSystemPrompt:
    def test_prompt_contains_topic_placeholder(self):
        assert "{topic}" in SYSTEM_PROMPT

    def test_prompt_formatted_with_topic(self):
        formatted = SYSTEM_PROMPT.format(topic="Binary Trees")
        assert "Binary Trees" in formatted
        assert "{topic}" not in formatted

    def test_prompt_requests_json_only_output(self):
        assert "JSON" in SYSTEM_PROMPT

    def test_prompt_requires_follow_up_suggestions_field(self):
        assert "followUpSuggestions" in SYSTEM_PROMPT

    def test_prompt_limits_suggestions_to_three(self):
        assert "3" in SYSTEM_PROMPT


class TestTutorChatRequest:
    def test_minimal_request_defaults(self):
        req = TutorChatRequest(studentId="s1", topic="Recursion", message="What is it?")
        assert req.conversationHistory == []
        assert req.documentIds is None
        assert req.studentContext == {}

    def test_full_request(self):
        history = [{"role": "user", "content": "Hi"}, {"role": "assistant", "content": "Hello"}]
        req = TutorChatRequest(
            studentId="s1",
            topic="Recursion",
            message="Explain base case",
            conversationHistory=history,
            documentIds=["doc-1"],
            studentContext={"streak": 5},
        )
        assert len(req.conversationHistory) == 2
        assert req.documentIds == ["doc-1"]
        assert req.studentContext["streak"] == 5


class TestTutorChatResponse:
    def test_minimal_response_defaults(self):
        resp = TutorChatResponse(reply="Hello learner")
        assert resp.sources == []
        assert resp.followUpSuggestions == []

    def test_full_response(self):
        resp = TutorChatResponse(
            reply="Great question!",
            sources=[{"doc": "doc-1"}],
            followUpSuggestions=["What is the base case?", "Can you give an example?"],
        )
        assert len(resp.sources) == 1
        assert len(resp.followUpSuggestions) == 2
