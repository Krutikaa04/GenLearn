from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.middleware.auth import verify_internal_key

router = APIRouter(dependencies=[Depends(verify_internal_key)])


class AdaptiveScoreRequest(BaseModel):
    studentId: str
    topic: str
    scorePercent: int = 0
    difficulty: str = "beginner"
    currentMasteryScore: float = 0.0
    quizScore: float = 0.0
    hintCount: int = 0
    totalTimeSeconds: int = 0
    questionCount: int = 0


class AdaptiveScoreResponse(BaseModel):
    recommendedDifficulty: str
    masterySignal: str  # 'improving' | 'mastered' | 'struggling'
    newMasteryScore: float
    masteryLevel: str


@router.post("/score", response_model=AdaptiveScoreResponse)
async def calculate_score(request: AdaptiveScoreRequest):
    score = request.scorePercent or int(request.quizScore * 100)
    current = request.difficulty

    if score >= 80:
        mastery_signal = "mastered" if score >= 90 else "improving"
        next_difficulty = {"beginner": "intermediate", "intermediate": "advanced"}.get(current, current)
    elif score >= 50:
        mastery_signal = "improving"
        next_difficulty = current
    else:
        mastery_signal = "struggling"
        next_difficulty = {"advanced": "intermediate", "intermediate": "beginner"}.get(current, current)

    mastery_score = min(100.0, request.currentMasteryScore * 0.6 + score * 0.4)
    mastery_level = (
        "mastered" if mastery_score >= 80
        else "proficient" if mastery_score >= 60
        else "developing" if mastery_score >= 40
        else "novice"
    )

    return AdaptiveScoreResponse(
        recommendedDifficulty=next_difficulty,
        masterySignal=mastery_signal,
        newMasteryScore=round(mastery_score, 1),
        masteryLevel=mastery_level,
    )
