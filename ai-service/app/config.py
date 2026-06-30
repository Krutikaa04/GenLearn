from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    PORT: int = 8000

    # AI Provider
    GEMINI_API_KEY: str
    MODEL_NAME: str = "gemini-1.5-flash"
    EMBEDDING_MODEL: str = "models/text-embedding-004"

    # Internal security
    INTERNAL_API_KEY: str

    # MongoDB (for vector search)
    MONGODB_URI: str

    # Backend URL (for CORS)
    BACKEND_URL: str = "http://backend:3000"

    # Redis
    REDIS_URL: str = "redis://redis:6379"

    class Config:
        env_file = ".env"


settings = Settings()
