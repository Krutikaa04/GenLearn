"""Shared grounding-context retrieval for lesson/quiz generation.

When RAG_GENERATION_ENABLED is on, generation grounds itself in the chunks
most relevant to the topic (Atlas $vectorSearch — the same pipeline the
/rag/query endpoint uses). Any retrieval failure or empty result falls back
to the legacy first-N-chunks concatenation, so generation never breaks and
never pretends to be grounded when it isn't.
"""

from typing import Any

from app.config import settings
from app.services.gemini import embed_query

VECTOR_LIMIT = 8
CONTEXT_CHAR_BUDGET = 8000


async def _concat_context(document_ids: list[str], db) -> str:
    """Legacy grounding: first 15 chunks of each document, in order."""
    parts = []
    for doc_id in document_ids:
        chunks = await db["document_chunks"].find(
            {"documentId": doc_id}, {"content": 1, "chunkIndex": 1}
        ).sort("chunkIndex", 1).limit(15).to_list(length=15)
        chunk_text = "\n\n".join(c["content"] for c in chunks)
        if chunk_text:
            parts.append(chunk_text)
    return "\n\n---\n\n".join(parts)


async def _vector_context(query: str, student_id: str, document_ids: list[str], db) -> str:
    query_embedding = await embed_query(query)
    match_filter: dict[str, Any] = {"studentId": student_id}
    if document_ids:
        match_filter["documentId"] = {"$in": document_ids}

    pipeline = [
        {
            "$vectorSearch": {
                "index": "vector_index",
                "path": "embedding",
                "queryVector": query_embedding,
                "numCandidates": 100,
                "limit": VECTOR_LIMIT,
                "filter": match_filter,
            }
        },
        {"$project": {"content": 1, "score": {"$meta": "vectorSearchScore"}}},
    ]
    chunks = await db["document_chunks"].aggregate(pipeline).to_list(length=VECTOR_LIMIT)
    return "\n\n---\n\n".join(c["content"] for c in chunks)


async def get_grounding_context(query: str, student_id: str, document_ids: list[str], db) -> str:
    """Best-available grounding context, truncated to the prompt budget.

    Vector retrieval when the flag is on; legacy concatenation as the
    fallback for flag-off, retrieval errors, or empty results.
    """
    if settings.RAG_GENERATION_ENABLED:
        try:
            context = await _vector_context(query, student_id, document_ids, db)
            if context:
                return context[:CONTEXT_CHAR_BUDGET]
        except Exception:
            pass  # degrade to the legacy path — never block generation on RAG

    context = await _concat_context(document_ids, db)
    return context[:CONTEXT_CHAR_BUDGET]
