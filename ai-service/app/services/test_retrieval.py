"""Tests for the flag-gated grounding-context retrieval."""

import pytest

from app.config import settings
from app.services import retrieval


@pytest.fixture
def anyio_backend():
    return "asyncio"


class FakeCursor:
    def __init__(self, docs):
        self._docs = docs

    def sort(self, *_args):
        return self

    def limit(self, *_args):
        return self

    async def to_list(self, length=None):
        return self._docs


class FakeCollection:
    def __init__(self, find_docs=None, aggregate_docs=None, aggregate_error=None):
        self._find_docs = find_docs or []
        self._aggregate_docs = aggregate_docs or []
        self._aggregate_error = aggregate_error

    def find(self, *_args, **_kwargs):
        return FakeCursor(self._find_docs)

    def aggregate(self, *_args, **_kwargs):
        if self._aggregate_error:
            raise self._aggregate_error
        return FakeCursor(self._aggregate_docs)


class FakeDb:
    def __init__(self, collection):
        self._collection = collection

    def __getitem__(self, _name):
        return self._collection


@pytest.mark.anyio
async def test_flag_off_uses_legacy_concatenation(monkeypatch):
    monkeypatch.setattr(settings, "RAG_GENERATION_ENABLED", False)
    db = FakeDb(FakeCollection(find_docs=[{"content": "chunk-a"}, {"content": "chunk-b"}]))

    context = await retrieval.get_grounding_context("topic", "s1", ["d1"], db)

    assert "chunk-a" in context and "chunk-b" in context


@pytest.mark.anyio
async def test_flag_on_uses_vector_search(monkeypatch):
    monkeypatch.setattr(settings, "RAG_GENERATION_ENABLED", True)

    async def fake_embed(_query):
        return [0.1, 0.2]

    monkeypatch.setattr(retrieval, "embed_query", fake_embed)
    db = FakeDb(FakeCollection(find_docs=[{"content": "legacy"}], aggregate_docs=[{"content": "relevant-chunk"}]))

    context = await retrieval.get_grounding_context("topic", "s1", ["d1"], db)

    assert context == "relevant-chunk"


@pytest.mark.anyio
async def test_vector_failure_degrades_to_legacy(monkeypatch):
    monkeypatch.setattr(settings, "RAG_GENERATION_ENABLED", True)

    async def fake_embed(_query):
        return [0.1, 0.2]

    monkeypatch.setattr(retrieval, "embed_query", fake_embed)
    db = FakeDb(FakeCollection(find_docs=[{"content": "legacy-chunk"}], aggregate_error=RuntimeError("no vector index")))

    context = await retrieval.get_grounding_context("topic", "s1", ["d1"], db)

    assert context == "legacy-chunk"


@pytest.mark.anyio
async def test_empty_vector_result_degrades_to_legacy(monkeypatch):
    monkeypatch.setattr(settings, "RAG_GENERATION_ENABLED", True)

    async def fake_embed(_query):
        return [0.1, 0.2]

    monkeypatch.setattr(retrieval, "embed_query", fake_embed)
    db = FakeDb(FakeCollection(find_docs=[{"content": "legacy-chunk"}], aggregate_docs=[]))

    context = await retrieval.get_grounding_context("topic", "s1", ["d1"], db)

    assert context == "legacy-chunk"
