from fastapi import HTTPException, Security
from fastapi.security.api_key import APIKeyHeader

from app.config import settings

api_key_header = APIKeyHeader(name="X-Internal-Key", auto_error=True)


async def verify_internal_key(api_key: str = Security(api_key_header)) -> str:
    if api_key != settings.INTERNAL_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid internal API key")
    return api_key
