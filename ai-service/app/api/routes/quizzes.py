from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Any, Optional
from uuid import uuid4
from app.middleware.auth import verify_internal_key
from app.services.gemini import generate_json

router = APIRouter(dependencies=[Depends(verify_internal_key)])


class GenerateQuizRequest(BaseModel):
    quizId: str
    studentId: str
    topic: str
    difficulty: str
    questionCount: int = 10
    questionTypes: list[str] = ["mcq"]
    documentIds: list[str] = []
    studentContext: dict = {}


class GenerateQuizResponse(BaseModel):
    title: str
    questions: list[dict[str, Any]]


QUIZ_PROMPT = """You are an expert educator creating a multiple-choice quiz.

Topic: {topic}
Difficulty: {difficulty}
Number of questions: {count}

Return ONLY valid JSON (no markdown, no explanation):
{{
  "title": "string",
  "questions": [
    {{
      "questionId": "string",
      "text": "string",
      "options": ["string", "string", "string", "string"],
      "correctIndex": integer,
      "explanation": "string"
    }}
  ]
}}

Requirements:
- Exactly {count} questions, each with exactly 4 options
- correctIndex is 0, 1, 2, or 3 — one correct answer per question
- Plausible distractors, varied question types
- Match difficulty: {difficulty}
"""


@router.post("/generate", response_model=GenerateQuizResponse)
async def generate_quiz(request: GenerateQuizRequest):
    prompt = QUIZ_PROMPT.format(topic=request.topic, difficulty=request.difficulty, count=request.questionCount)
    try:
        data = await generate_json(prompt, temperature=0.5)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI generation failed: {e}")

    for q in data.get("questions", []):
        q["questionId"] = str(uuid4())

    try:
        return GenerateQuizResponse(**data)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI response malformed: {e}")
