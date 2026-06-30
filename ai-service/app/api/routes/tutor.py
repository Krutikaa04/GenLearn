from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.middleware.auth import verify_internal_key
from app.services.gemini import generate_json

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
- Use the Socratic method: ask clarifying questions to guide the learner to the answer
- Break complex concepts into simple steps using analogies and real-world examples
- Offer a practice problem or challenge after explaining a concept
- Celebrate progress, correct mistakes gently and constructively
- Keep your reply focused and under 300 words unless more depth is requested

Return ONLY valid JSON (no markdown):
{{
  "reply": "your tutor response here",
  "followUpSuggestions": ["follow-up question 1", "follow-up question 2", "follow-up question 3"]
}}

followUpSuggestions must be 3 short questions or prompts the learner might naturally ask next."""


@router.post("/chat", response_model=TutorChatResponse)
async def tutor_chat(request: TutorChatRequest):
    system = SYSTEM_PROMPT.format(topic=request.topic)

    history_text = ""
    for msg in request.conversationHistory[-10:]:
        role = "Student" if msg.get("role") == "user" else "Tutor"
        history_text += f"\n{role}: {msg.get('content', '')}"

    prompt = f"{system}\n\nConversation so far:{history_text}\n\nStudent: {request.message}"

    try:
        data = await generate_json(prompt, temperature=0.7)
        reply = data.get("reply", "").strip()
        suggestions = data.get("followUpSuggestions", [])[:3]
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI generation failed: {e}")

    return TutorChatResponse(reply=reply, followUpSuggestions=suggestions)
