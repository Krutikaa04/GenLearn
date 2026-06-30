from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.api.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"AI Platform starting — environment: {settings.ENVIRONMENT}")
    yield
    print("AI Platform shutting down")


app = FastAPI(
    title="GenLearn AI Platform",
    version="1.0.0",
    docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url=None,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.BACKEND_URL],
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["X-Internal-Key", "Content-Type"],
)

app.include_router(api_router, prefix="/ai/v1")


@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0", "service": "ai-platform"}
