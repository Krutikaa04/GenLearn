from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional

from app.middleware.auth import verify_internal_key

router = APIRouter(dependencies=[Depends(verify_internal_key)])


class GenerateLessonRequest(BaseModel):
    topic: str
    difficulty: str
    learningGoal: Optional[str] = None
    documentIds: Optional[list[str]] = None
    studentContext: dict


class LessonContent(BaseModel):
    learningObjectives: list[str]
    explanation: str
    examples: list[str]
    analogies: list[str]
    keyPoints: list[str]
    summary: str
    revisionQuestions: list[str]
    codeSnippets: list[dict]


class GenerateLessonResponse(BaseModel):
    content: LessonContent
    tokenUsage: dict


@router.post("/generate", response_model=GenerateLessonResponse)
async def generate_lesson(request: GenerateLessonRequest):
    # TODO: implement lesson generation
    raise NotImplementedError("Lesson generation not yet implemented")
