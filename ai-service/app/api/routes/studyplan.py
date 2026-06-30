from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.middleware.auth import verify_internal_key
from app.services.gemini import generate_json

router = APIRouter(dependencies=[Depends(verify_internal_key)])


class TopicMastery(BaseModel):
    topic: str
    masteryScore: float  # 0-100


class GenerateStudyPlanRequest(BaseModel):
    userId: str
    goal: str
    targetDate: str  # ISO date string
    topics: list[str]
    masteryData: list[TopicMastery] = []
    hoursPerDay: float = 2.0


class StudyTask(BaseModel):
    type: str  # lesson | quiz | flashcard_review | reading
    topic: str
    durationMinutes: int
    priority: str  # high | medium | low
    rationale: str


class StudyDay(BaseModel):
    day: int
    date: str
    tasks: list[StudyTask]
    totalMinutes: int


class GenerateStudyPlanResponse(BaseModel):
    title: str
    summary: str
    plan: list[StudyDay]


STUDY_PLAN_PROMPT = """You are an expert learning coach generating a personalized day-by-day study plan.

Goal: {goal}
Target date: {target_date}
Topics to cover: {topics}
Current mastery per topic: {mastery_info}
Available study time: {hours_per_day} hours per day

Rules:
- Allocate more time to topics with lower mastery scores
- Topics with mastery >= 80 only need a quick review (1 session)
- Topics with mastery < 40 need multiple sessions spread across days
- Mix activity types: lessons to learn, quizzes to test, flashcard reviews to retain
- Be realistic about time — {hours_per_day} hours/day = {minutes_per_day} minutes/day
- Each task should be 20-45 minutes

Return ONLY valid JSON (no markdown):
{{
  "title": "string (short plan title)",
  "summary": "string (2-3 sentences explaining the strategy)",
  "plan": [
    {{
      "day": 1,
      "date": "YYYY-MM-DD",
      "tasks": [
        {{
          "type": "lesson|quiz|flashcard_review|reading",
          "topic": "string",
          "durationMinutes": integer,
          "priority": "high|medium|low",
          "rationale": "short reason (e.g. 'Low mastery — needs foundational lesson')"
        }}
      ],
      "totalMinutes": integer
    }}
  ]
}}

Generate the full plan from today up to the target date. Include every day that has study tasks."""


@router.post("/generate", response_model=GenerateStudyPlanResponse)
async def generate_study_plan(request: GenerateStudyPlanRequest):
    mastery_map = {m.topic: m.masteryScore for m in request.masteryData}
    mastery_lines = []
    for topic in request.topics:
        score = mastery_map.get(topic, 0)
        mastery_lines.append(f"  - {topic}: {score:.0f}%")
    mastery_info = "\n".join(mastery_lines) if mastery_lines else "  (no prior data — assume beginner)"

    prompt = STUDY_PLAN_PROMPT.format(
        goal=request.goal,
        target_date=request.targetDate,
        topics=", ".join(request.topics),
        mastery_info=mastery_info,
        hours_per_day=request.hoursPerDay,
        minutes_per_day=int(request.hoursPerDay * 60),
    )

    try:
        data = await generate_json(prompt, temperature=0.4)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI generation failed: {e}")

    try:
        return GenerateStudyPlanResponse(**data)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI response malformed: {e}")
