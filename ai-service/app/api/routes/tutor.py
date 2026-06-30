from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional

from app.middleware.auth import verify_internal_key

router = APIRouter(dependencies=[Depends(verify_internal_key)])


class TutorChatRequest(BaseModel):
    message: str
    conversationHistory: list[dict]
    studentContext: dict
    documentIds: Optional[list[str]] = None


class TutorChatResponse(BaseModel):
    content: str
    sources: list[dict]
    followUpSuggestions: list[str]
    tokenUsage: dict


@router.post("/chat", response_model=TutorChatResponse)
async def tutor_chat(request: TutorChatRequest):
    # TODO: implement tutor chat with RAG
    raise NotImplementedError("Tutor chat not yet implemented")
