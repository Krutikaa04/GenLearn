"""Async MongoDB client — shared motor instance."""
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConfigurationError
from app.config import settings

logger = logging.getLogger(__name__)

_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.MONGODB_URI)
    return _client


def get_db():
    # Prefer the database name embedded in MONGODB_URI so this always matches
    # whatever database the backend's DATABASE_URL points at — db names are
    # case-sensitive and a hardcoded name here caused a production mismatch before.
    client = get_client()
    try:
        return client.get_default_database()
    except ConfigurationError:
        # MONGODB_URI omitted the database (e.g. ".../" or ".../?retryWrites=...").
        # Without this, get_default_database() raises and every request that
        # touches Mongo (document ingestion, RAG retrieval) 500s. Fall back to the
        # configured name so the service degrades gracefully instead of failing.
        logger.warning(
            "MONGODB_URI has no database name — falling back to MONGODB_DB=%r. "
            "Add the db name to MONGODB_URI so it matches the backend exactly.",
            settings.MONGODB_DB,
        )
        return client[settings.MONGODB_DB]
