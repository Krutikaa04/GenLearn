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
    # Challenge mode
    challengeMode: bool = False
    challengeTopics: list[str] = []
    timeLimitMinutes: Optional[int] = None


class GenerateQuizResponse(BaseModel):
    title: str
    questions: list[dict[str, Any]]
    timeLimitMinutes: Optional[int] = None
    challengeMode: bool = False


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
      "explanation": "string",
      "topic": "{topic}"
    }}
  ]
}}

Requirements:
- Exactly {count} questions, each with exactly 4 options
- correctIndex is 0, 1, 2, or 3 — one correct answer per question
- Plausible distractors, varied question types
- Match difficulty: {difficulty}
"""

CHALLENGE_PROMPT = """You are an expert educator creating a multi-topic challenge quiz.

Topics and their question counts:
{topic_counts}

Total questions: {total_count}
Difficulty: {difficulty}

Return ONLY valid JSON (no markdown, no explanation):
{{
  "title": "string (e.g. 'Multi-Topic Challenge')",
  "questions": [
    {{
      "questionId": "string",
      "text": "string",
      "options": ["string", "string", "string", "string"],
      "correctIndex": integer,
      "explanation": "string",
      "topic": "the specific topic this question covers"
    }}
  ]
}}

Requirements:
- Each question must have exactly 4 options
- correctIndex is 0, 1, 2, or 3
- Distribute questions across topics as specified
- Questions should be mixed (not grouped by topic)
- Plausible distractors, varied difficulty within {difficulty} level
"""


@router.post("/generate", response_model=GenerateQuizResponse)
async def generate_quiz(request: GenerateQuizRequest):
    if request.challengeMode and request.challengeTopics:
        # Distribute questions across topics: weak topics (listed first) get more questions
        n = len(request.challengeTopics)
        total = request.questionCount
        # Weighted distribution: topic[0] gets most, topic[-1] gets least
        weights = [n - i for i in range(n)]
        weight_sum = sum(weights)
        counts = [max(1, round(total * w / weight_sum)) for w in weights]
        # Adjust to exactly total
        diff = total - sum(counts)
        counts[0] += diff

        topic_counts = "\n".join(
            f"- {topic}: {count} question{'s' if count != 1 else ''}"
            for topic, count in zip(request.challengeTopics, counts)
        )
        prompt = CHALLENGE_PROMPT.format(
            topic_counts=topic_counts,
            total_count=total,
            difficulty=request.difficulty,
        )
    else:
        prompt = QUIZ_PROMPT.format(
            topic=request.topic,
            difficulty=request.difficulty,
            count=request.questionCount,
        )

    try:
        data = await generate_json(prompt, temperature=0.5)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI generation failed: {e}")

    for q in data.get("questions", []):
        q["questionId"] = str(uuid4())

    try:
        result = GenerateQuizResponse(
            title=data["title"],
            questions=data["questions"],
            challengeMode=request.challengeMode,
            timeLimitMinutes=request.timeLimitMinutes,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI response malformed: {e}")
