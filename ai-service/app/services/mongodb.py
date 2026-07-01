"""Async MongoDB client — shared motor instance."""
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.MONGODB_URI)
    return _client


def get_db():
    # Use the database name embedded in MONGODB_URI itself rather than a hardcoded
    # name, so this always matches whatever database the backend's DATABASE_URL
    # points at — MongoDB database names are case-sensitive and Atlas rejects two
    # databases differing only in case, which a mismatched hardcoded name here
    # triggered in production.
    return get_client().get_default_database()
