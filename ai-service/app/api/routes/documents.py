from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from uuid import uuid4
from app.middleware.auth import verify_internal_key
from app.services.text_extractor import extract_text
from app.services.chunker import chunk_text
from app.services.gemini import embed_text
from app.services.mongodb import get_db

router = APIRouter(dependencies=[Depends(verify_internal_key)])


class ProcessDocumentRequest(BaseModel):
    documentId: str
    studentId: str
    storagePath: str
    fileType: str


class ProcessDocumentResponse(BaseModel):
    chunkCount: int
    pageCount: int | None


@router.post("/process", response_model=ProcessDocumentResponse)
async def process_document(request: ProcessDocumentRequest):
    try:
        text = extract_text(request.storagePath)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Text extraction failed: {e}")

    if not text.strip():
        raise HTTPException(status_code=422, detail="Document contains no extractable text")

    chunks = chunk_text(text)
    db = get_db()

    await db["document_chunks"].delete_many({"documentId": request.documentId})

    chunk_docs = []
    for chunk in chunks:
        try:
            embedding = await embed_text(chunk.content)
        except Exception:
            embedding = []

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

    if chunk_docs:
        await db["document_chunks"].insert_many(chunk_docs)

    return ProcessDocumentResponse(chunkCount=len(chunk_docs), pageCount=None)
