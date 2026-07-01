"""Gemini client — single shared instance with retry logic."""
import json
import re
from google import genai
from google.genai import types
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from app.config import settings

_client = genai.Client(api_key=settings.GEMINI_API_KEY)


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type(Exception),
    reraise=True,
)
async def generate_text(prompt: str, temperature: float = 0.7) -> str:
    response = await _client.aio.models.generate_content(
        model=settings.MODEL_NAME,
        contents=prompt,
        config=types.GenerateContentConfig(temperature=temperature),
    )
    return response.text


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    reraise=True,
)
async def generate_json(prompt: str, temperature: float = 0.3) -> dict:
    """Generate text and parse as JSON. Strips markdown code fences if present."""
    raw = await generate_text(prompt, temperature)
    # Strip ```json ... ``` fences
    cleaned = re.sub(r"^```(?:json)?\s*", "", raw.strip(), flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned.strip())
    return json.loads(cleaned)


async def embed_text(text: str) -> list[float]:
    result = await _client.aio.models.embed_content(
        model=settings.EMBEDDING_MODEL,
        contents=text,
        config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT"),
    )
    return result.embeddings[0].values


async def embed_query(text: str) -> list[float]:
    result = await _client.aio.models.embed_content(
        model=settings.EMBEDDING_MODEL,
        contents=text,
        config=types.EmbedContentConfig(task_type="RETRIEVAL_QUERY"),
    )
    return result.embeddings[0].values
