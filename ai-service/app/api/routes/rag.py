from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Any
from app.middleware.auth import verify_internal_key
from app.services.gemini import generate_text, embed_query
from app.services.mongodb import get_db

router = APIRouter(dependencies=[Depends(verify_internal_key)])


class RAGQueryRequest(BaseModel):
    question: str
    studentId: str
    documentIds: list[str] = []
    studentContext: dict = {}


class RagQueryResponse(BaseModel):
    answer: str
    grounded: bool
    sources: list[dict[str, Any]]


RAG_PROMPT = """You are a helpful AI tutor. Answer the student's question using ONLY the context below.
If the context does not contain enough information, say so — do not fabricate.

Context:
{context}

Question: {question}

Provide a clear, educational answer. Use bullet points where helpful.
"""


@router.post("/query", response_model=RagQueryResponse)
async def rag_query(request: RAGQueryRequest):
    try:
        query_embedding = await embed_query(request.question)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Embedding failed: {e}")

    db = get_db()
    match_filter: dict[str, Any] = {"studentId": request.studentId}
    if request.documentIds:
        match_filter["documentId"] = {"$in": request.documentIds}

    try:
        pipeline = [
            {
                "$vectorSearch": {
                    "index": "vector_index",
                    "path": "embedding",
                    "queryVector": query_embedding,
                    "numCandidates": 100,
                    "limit": 5,
                    "filter": match_filter,
                }
            },
            {
                "$project": {
                    "chunkId": 1,
                    "documentId": 1,
                    "content": 1,
                    "pageNumber": 1,
                    "heading": 1,
                    "score": {"$meta": "vectorSearchScore"},
                }
            },
        ]
        chunks = await db["document_chunks"].aggregate(pipeline).to_list(length=5)
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Vector search failed: {e}. Ensure Atlas Vector Search index 'vector_index' is created on document_chunks.embedding.",
        )

    grounded = bool(chunks)
    context = "\n\n---\n\n".join(c["content"] for c in chunks) if chunks else "No relevant context found."

    try:
        answer = await generate_text(RAG_PROMPT.format(context=context, question=request.question), temperature=0.3)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI generation failed: {e}")

    sources = [
        {
            "chunkId": c["chunkId"],
            "documentId": c["documentId"],
            "pageNumber": c.get("pageNumber"),
            "heading": c.get("heading"),
            "excerpt": c["content"][:200] + "..." if len(c["content"]) > 200 else c["content"],
        }
        for c in chunks
    ]

    return RagQueryResponse(answer=answer, grounded=grounded, sources=sources)
