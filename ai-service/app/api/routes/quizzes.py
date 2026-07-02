from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Any, Optional
from uuid import uuid4
from app.middleware.auth import verify_internal_key
from app.services.gemini import generate_json
from app.services.mongodb import get_db

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
{context_block}

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


def distribute_challenge_questions(num_topics: int, total: int) -> list[int]:
    """Weighted question distribution across challenge topics.

    Topic 0 (the weakest, by caller convention) gets the most questions,
    the last topic gets the fewest. Counts always sum to exactly `total`
    and are never negative. When `total` is at least `num_topics`, every
    topic gets at least 1 question; when there are more topics than
    questions, the lowest-priority topics may get 0.
    """
    if num_topics <= 0 or total <= 0:
        return [0] * max(num_topics, 0)

    weights = [num_topics - i for i in range(num_topics)]
    weight_sum = sum(weights)
    counts = [max(0, round(total * w / weight_sum)) for w in weights]

    # Rounding can leave the sum off by a few — walk the list (highest
    # priority first) handing out/reclaiming one question at a time until
    # it matches exactly, never letting a count go negative.
    diff = total - sum(counts)
    i = 0
    while diff != 0:
        idx = i % num_topics
        if diff > 0:
            counts[idx] += 1
            diff -= 1
        elif counts[idx] > 0:
            counts[idx] -= 1
            diff += 1
        i += 1

    return counts


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


@router.post("/generate", response_model=GenerateQuizResponse)
async def generate_quiz(request: GenerateQuizRequest):
    if request.challengeMode and request.challengeTopics:
        # Distribute questions across topics: weak topics (listed first) get more questions
        total = request.questionCount
        counts = distribute_challenge_questions(len(request.challengeTopics), total)

        topic_counts = "\n".join(
            f"- {topic}: {count} question{'s' if count != 1 else ''}"
            for topic, count in zip(request.challengeTopics, counts)
            if count > 0
        )
        prompt = CHALLENGE_PROMPT.format(
            topic_counts=topic_counts,
            total_count=total,
            difficulty=request.difficulty,
        )
    else:
        context_block = ""
        if request.documentIds:
            context = await _get_document_context(request.documentIds, get_db())
            if context:
                context_block = f"Ground the questions in this source material where relevant:\n{context[:8000]}"

        prompt = QUIZ_PROMPT.format(
            topic=request.topic,
            difficulty=request.difficulty,
            count=request.questionCount,
            context_block=context_block,
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
