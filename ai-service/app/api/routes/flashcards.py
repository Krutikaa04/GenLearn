from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Any, Optional
from uuid import uuid4
from app.middleware.auth import verify_internal_key
from app.services.gemini import generate_json
from app.services.mongodb import get_db

router = APIRouter(dependencies=[Depends(verify_internal_key)])


class GenerateFlashcardsRequest(BaseModel):
    setId: str
    studentId: str
    sourceType: str  # 'document' | 'lesson'
    sourceId: str
    count: int = 15
    content: Optional[str] = None
    topic: Optional[str] = None
    source: Optional[str] = None  # legacy


class GenerateFlashcardsResponse(BaseModel):
    cards: list[dict[str, Any]]


FLASHCARD_PROMPT = """You are an expert educator creating flashcards for active recall learning.

Context:
{context}

Generate exactly {count} flashcard pairs. Return ONLY valid JSON (no markdown):
{{
  "cards": [
    {{
      "front": "string — concise question or term (under 20 words)",
      "back": "string — clear, complete answer (under 60 words)",
      "hint": "string or null"
    }}
  ]
}}

Requirements:
- Exactly {count} cards covering the most important concepts
- Mix types: definition, application, cause-effect
- Front is a genuine question/term; Back is self-contained
"""


async def _get_context(source_type: str, source_id: str, db) -> str:
    if source_type == "document":
        chunks = await db["document_chunks"].find(
            {"documentId": source_id}, {"content": 1, "chunkIndex": 1}
        ).sort("chunkIndex", 1).limit(20).to_list(length=20)
        return "\n\n".join(c["content"] for c in chunks)

    if source_type == "lesson":
        lesson = await db["lessons"].find_one({"lessonId": source_id})
        if not lesson:
            return ""
        parts = [lesson.get("title", ""), lesson.get("summary", "")]
        for section in lesson.get("sections", []):
            parts.append(section.get("heading", ""))
            parts.append(section.get("content", ""))
        return "\n\n".join(p for p in parts if p)

    return ""


@router.post("/generate", response_model=GenerateFlashcardsResponse)
async def generate_flashcards(request: GenerateFlashcardsRequest):
    if request.content:
        context = request.content
    else:
        db = get_db()
        context = await _get_context(request.sourceType, request.sourceId, db)

    if not context.strip():
        raise HTTPException(
            status_code=422,
            detail=f"No content found for {request.sourceType} {request.sourceId}",
        )

    prompt = FLASHCARD_PROMPT.format(count=request.count, context=context[:8000])
    try:
        data = await generate_json(prompt, temperature=0.5)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI generation failed: {e}")

    for card in data.get("cards", []):
        card["cardId"] = str(uuid4())
        card.setdefault("hint", None)

    try:
        return GenerateFlashcardsResponse(**data)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI response malformed: {e}")
