from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Any, Optional
from app.middleware.auth import verify_internal_key
from app.services.gemini import generate_json
from app.services.mongodb import get_db

router = APIRouter(dependencies=[Depends(verify_internal_key)])


class GenerateLessonRequest(BaseModel):
    lessonId: str
    studentId: str
    topic: str
    difficulty: str
    documentIds: list[str] = []
    learningGoal: Optional[str] = None
    studentContext: dict = {}


class GenerateLessonResponse(BaseModel):
    title: str
    summary: str
    sections: list[dict[str, Any]]
    keyTakeaways: list[str]
    estimatedReadMinutes: int


LESSON_PROMPT = """You are an expert educator. Generate a comprehensive lesson on the topic below.

Topic: {topic}
Difficulty: {difficulty}
{goal_line}
{context_block}

Return ONLY valid JSON (no markdown, no explanation):
{{
  "title": "string",
  "summary": "string — 2-3 sentence overview",
  "sections": [
    {{
      "heading": "string",
      "content": "string — detailed explanation (200-400 words)",
      "keyPoints": ["string", "string", "string"],
      "codeExample": "string or null"
    }}
  ],
  "keyTakeaways": ["string", "string", "string", "string", "string"],
  "estimatedReadMinutes": integer
}}

Requirements:
- 3-5 sections progressing from fundamentals to advanced application
- Each section must have at least 3 keyPoints
- Add codeExample for programming/technical topics (null otherwise)
- Exactly 5 keyTakeaways
- Match difficulty: {difficulty}
"""


async def _get_document_context(document_ids: list[str], db) -> str:
    parts = []
    for doc_id in document_ids:
        chunks = await db["document_chunks"].find(
            {"documentId": doc_id}, {"content": 1, "chunkIndex": 1}
        ).sort("chunkIndex", 1).limit(15).to_list(length=15)
        chunk_text = "\n\n".join(c["content"] for c in chunks)
        if chunk_text:
            parts.append(chunk_text)
    return "\n\n---\n\n".join(parts)


@router.post("/generate", response_model=GenerateLessonResponse)
async def generate_lesson(request: GenerateLessonRequest):
    goal_line = f"Learning goal: {request.learningGoal}" if request.learningGoal else ""

    context_block = ""
    if request.documentIds:
        context = await _get_document_context(request.documentIds, get_db())
        if context:
            context_block = f"Ground the lesson in this source material where relevant:\n{context[:8000]}"

    prompt = LESSON_PROMPT.format(
        topic=request.topic, difficulty=request.difficulty, goal_line=goal_line, context_block=context_block
    )
    try:
        data = await generate_json(prompt, temperature=0.6)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI generation failed: {e}")

    try:
        return GenerateLessonResponse(**data)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI response malformed: {e}")
