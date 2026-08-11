import base64
import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from uuid import uuid4
from app.middleware.auth import verify_internal_key
from app.services.text_extractor import extract_text
from app.services.chunker import chunk_text
from app.services.gemini import embed_texts, raise_provider_error
from app.services.mongodb import get_db

logger = logging.getLogger(__name__)

router = APIRouter(dependencies=[Depends(verify_internal_key)])


class ProcessDocumentRequest(BaseModel):
    documentId: str
    studentId: str
    fileContent: str  # base64-encoded file bytes — backend and ai-service run as
    # separate deployed services with no shared filesystem, so the file can't be
    # read by local path; it's sent over the wire instead.
    fileType: str


class ProcessDocumentResponse(BaseModel):
    chunkCount: int
    pageCount: int | None


@router.post("/process", response_model=ProcessDocumentResponse)
async def process_document(request: ProcessDocumentRequest):
    try:
        content = base64.b64decode(request.fileContent)
        text = extract_text(content, request.fileType)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Text extraction failed: {e}")

    if not text.strip():
        raise HTTPException(status_code=422, detail="Document contains no extractable text")

    chunks = chunk_text(text)
    db = get_db()

    await db["document_chunks"].delete_many({"documentId": request.documentId})

    # Embeddings are best-effort per chunk. A chunk whose embedding fails is still
    # stored (with an empty vector) so the document remains usable for text-based
    # grounding — retrieval.py falls back to raw-chunk concatenation when vector
    # search is unavailable, so lessons/quizzes/flashcards from this document keep
    # working. Failures are logged (never silently swallowed). Only a *total*
    # embedding failure raises a categorized error, which signals a real provider
    # or config problem (bad model / key / outage) rather than a transient blip.
    chunk_docs = []
    embed_failures = 0
    last_error: Exception | None = None
    EMBED_BATCH = 100
    for start in range(0, len(chunks), EMBED_BATCH):
        batch = chunks[start:start + EMBED_BATCH]
        try:
            vectors = await embed_texts([c.content for c in batch])
        except Exception as e:
            embed_failures += len(batch)
            last_error = e
            vectors = [[] for _ in batch]
            logger.warning(
                "Embedding batch failed for document %s (chunks %d-%d): %s",
                request.documentId, start, start + len(batch) - 1, e,
            )

        for chunk, embedding in zip(batch, vectors):
            chunk_docs.append({
                "chunkId": str(uuid4()),
                "documentId": request.documentId,
                "studentId": request.studentId,
                "content": chunk.content,
                "embedding": embedding,
                "pageNumber": None,
                "heading": None,
                "chunkIndex": chunk.chunk_index,
                "tokenCount": chunk.token_count,
            })

    # Every embedding failed → the embedding provider/model is broken, not a blip.
    # Surface it as a categorized error so the document is marked FAILED with a
    # meaningful reason instead of silently ingesting a fully unusable document.
    if chunks and embed_failures == len(chunks):
        raise raise_provider_error(last_error)

    if embed_failures:
        logger.warning(
            "Document %s ingested with %d/%d chunks un-embedded (text-only grounding)",
            request.documentId, embed_failures, len(chunks),
        )

    if chunk_docs:
        await db["document_chunks"].insert_many(chunk_docs)

    return ProcessDocumentResponse(chunkCount=len(chunk_docs), pageCount=None)
