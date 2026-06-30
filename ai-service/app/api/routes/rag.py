from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.middleware.auth import verify_internal_key

router = APIRouter(dependencies=[Depends(verify_internal_key)])


class RAGQueryRequest(BaseModel):
    question: str
    studentId: str
    documentIds: list[str]
    studentContext: dict


@router.post("/query")
async def rag_query(request: RAGQueryRequest):
    raise NotImplementedError("RAG query not yet implemented")
