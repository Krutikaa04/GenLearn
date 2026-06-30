from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.middleware.auth import verify_internal_key

router = APIRouter(dependencies=[Depends(verify_internal_key)])


class AdaptiveScoreRequest(BaseModel):
    studentId: str
    currentMasteryScore: float
    topic: str
    quizScore: float
    hintCount: int
    totalTimeSeconds: int
    questionCount: int


class AdaptiveScoreResponse(BaseModel):
    newMasteryScore: float
    masteryLevel: str
    recommendedDifficulty: str


@router.post("/score", response_model=AdaptiveScoreResponse)
async def calculate_score(request: AdaptiveScoreRequest):
    raise NotImplementedError("Adaptive scoring not yet implemented")
