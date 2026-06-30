from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional

from app.middleware.auth import verify_internal_key

router = APIRouter(dependencies=[Depends(verify_internal_key)])


class GenerateQuizRequest(BaseModel):
    topic: str
    difficulty: str
    questionCount: int = 10
    questionTypes: list[str] = ["mcq"]
    documentIds: Optional[list[str]] = None
    studentContext: dict


class EvaluateQuizRequest(BaseModel):
    questions: list[dict]
    answers: list[dict]
    studentContext: dict


@router.post("/generate")
async def generate_quiz(request: GenerateQuizRequest):
    raise NotImplementedError("Quiz generation not yet implemented")


@router.post("/evaluate")
async def evaluate_quiz(request: EvaluateQuizRequest):
    raise NotImplementedError("Quiz evaluation not yet implemented")
