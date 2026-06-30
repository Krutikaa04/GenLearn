from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.middleware.auth import verify_internal_key
from app.services.gemini import generate_text

router = APIRouter(dependencies=[Depends(verify_internal_key)])


class TutorChatRequest(BaseModel):
    studentId: str
    topic: str
    message: str
    conversationHistory: list[dict] = []
    documentIds: Optional[list[str]] = None
    studentContext: dict = {}


class TutorChatResponse(BaseModel):
    reply: str
    sources: list[dict] = []
    followUpSuggestions: list[str] = []


SYSTEM_PROMPT = """You are GenLearn AI Tutor — patient, encouraging, and expert.
Topic: {topic}

Teaching guidelines:
- Break complex concepts into simple steps using analogies and examples
- Ask clarifying questions to check understanding
- Offer practice problems when appropriate
- Celebrate progress, correct mistakes gently
- Keep responses focused and under 300 words unless the student asks for more
"""


@router.post("/chat", response_model=TutorChatResponse)
async def tutor_chat(request: TutorChatRequest):
    system = SYSTEM_PROMPT.format(topic=request.topic)

    history_text = ""
    for msg in request.conversationHistory[-10:]:
        role = "Student" if msg.get("role") == "user" else "Tutor"
        history_text += f"\n{role}: {msg.get('content', '')}"

    prompt = f"{system}\n\nConversation:{history_text}\n\nStudent: {request.message}\n\nTutor:"

    try:
        reply = await generate_text(prompt, temperature=0.7)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI generation failed: {e}")

    return TutorChatResponse(reply=reply.strip())
