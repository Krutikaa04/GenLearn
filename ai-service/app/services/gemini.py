"""Gemini client — single shared instance with retry logic."""
import json
import re
import google.generativeai as genai
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from app.config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)

_model = genai.GenerativeModel(settings.MODEL_NAME)


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type(Exception),
    reraise=True,
)
async def generate_text(prompt: str, temperature: float = 0.7) -> str:
    response = await _model.generate_content_async(
        prompt,
        generation_config=genai.GenerationConfig(temperature=temperature),
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
    result = await genai.embed_content_async(
        model=settings.EMBEDDING_MODEL,
        content=text,
        task_type="retrieval_document",
    )
    return result["embedding"]


async def embed_query(text: str) -> list[float]:
    result = await genai.embed_content_async(
        model=settings.EMBEDDING_MODEL,
        content=text,
        task_type="retrieval_query",
    )
    return result["embedding"]
