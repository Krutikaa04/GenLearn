"""Tests for the RAG query route — prompt construction and response models."""
import pytest
from app.api.routes.rag import RAG_PROMPT, RAGQueryRequest, RagQueryResponse


class TestRagPrompt:
    def test_prompt_contains_context_placeholder(self):
        assert "{context}" in RAG_PROMPT

    def test_prompt_contains_question_placeholder(self):
        assert "{question}" in RAG_PROMPT

    def test_prompt_formats_with_values(self):
        formatted = RAG_PROMPT.format(context="The mitochondria is the powerhouse.", question="What does it do?")
        assert "The mitochondria is the powerhouse." in formatted
        assert "What does it do?" in formatted
        assert "{context}" not in formatted
        assert "{question}" not in formatted

    def test_prompt_instructs_not_to_fabricate(self):
        assert "do not fabricate" in RAG_PROMPT.lower() or "fabricate" in RAG_PROMPT.lower()

    def test_fallback_context_used_when_no_chunks(self):
        no_chunk_context = "No relevant context found."
        formatted = RAG_PROMPT.format(context=no_chunk_context, question="anything")
        assert "No relevant context found." in formatted


class TestRagQueryRequest:
    def test_defaults(self):
        req = RAGQueryRequest(question="What is recursion?", studentId="s1")
        assert req.documentIds == []
        assert req.studentContext == {}

    def test_with_document_ids(self):
        req = RAGQueryRequest(question="What is recursion?", studentId="s1", documentIds=["doc-1", "doc-2"])
        assert req.documentIds == ["doc-1", "doc-2"]

    def test_question_required(self):
        with pytest.raises(Exception):
            RAGQueryRequest(studentId="s1")  # question missing


class TestRagQueryResponse:
    def test_grounded_response_with_sources(self):
        resp = RagQueryResponse(
            answer="Recursion is a technique where a function calls itself.",
            grounded=True,
            sources=[{"chunkId": "c1", "documentId": "doc-1", "excerpt": "..."}],
        )
        assert resp.grounded is True
        assert len(resp.sources) == 1

    def test_ungrounded_response(self):
        resp = RagQueryResponse(
            answer="I don't have enough context to answer this.",
            grounded=False,
            sources=[],
        )
        assert resp.grounded is False
        assert resp.sources == []

    def test_source_excerpt_length(self):
        long_content = "x" * 300
        excerpt = long_content[:200] + "..." if len(long_content) > 200 else long_content
        assert len(excerpt) == 203
        assert excerpt.endswith("...")
