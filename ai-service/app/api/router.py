from fastapi import APIRouter

from app.api.routes import tutor, lessons, quizzes, flashcards, rag, adaptive, documents, studyplan

api_router = APIRouter()

api_router.include_router(tutor.router, prefix="/tutor", tags=["tutor"])
api_router.include_router(lessons.router, prefix="/lessons", tags=["lessons"])
api_router.include_router(quizzes.router, prefix="/quizzes", tags=["quizzes"])
api_router.include_router(flashcards.router, prefix="/flashcards", tags=["flashcards"])
api_router.include_router(rag.router, prefix="/rag", tags=["rag"])
api_router.include_router(adaptive.router, prefix="/adaptive", tags=["adaptive"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(studyplan.router, prefix="/studyplan", tags=["studyplan"])
