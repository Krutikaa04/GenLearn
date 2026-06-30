from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional

from app.middleware.auth import verify_internal_key

router = APIRouter(dependencies=[Depends(verify_internal_key)])


class GenerateFlashcardsRequest(BaseModel):
    content: str
    topic: Optional[str] = None
    count: int = 15
    source: str


@router.post("/generate")
async def generate_flashcards(request: GenerateFlashcardsRequest):
    raise NotImplementedError("Flashcard generation not yet implemented")
