"""Gemini client — single shared instance with retry logic."""
import json
import re
from google import genai
from google.genai import types
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from app.config import settings

_client = genai.Client(api_key=settings.GEMINI_API_KEY)

# gemini-2.5-flash runs an internal "thinking" pass before responding, which
# adds ~10-40s of latency per call. Our prompts are explicit and structured, so
# that reasoning buys little — disabling it (budget 0) is the single biggest
# speed-up for quiz/flashcard/lesson/tutor/study-plan generation.
_NO_THINKING = types.ThinkingConfig(thinking_budget=0)


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type(Exception),
    reraise=True,
)
async def generate_text(prompt: str, temperature: float = 0.7, json_mode: bool = False) -> str:
    response = await _client.aio.models.generate_content(
        model=settings.MODEL_NAME,
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=temperature,
            thinking_config=_NO_THINKING,
            # Force raw JSON so the model can't wrap it in prose/markdown, which
            # avoids parse failures that trigger a full (slow) regeneration.
            response_mime_type="application/json" if json_mode else None,
        ),
    )
    return response.text


@retry(
    stop=stop_after_attempt(2),
    wait=wait_exponential(multiplier=1, min=2, max=6),
    reraise=True,
)
async def generate_json(prompt: str, temperature: float = 0.3) -> dict:
    """Generate JSON. Requests JSON output mode; still strips markdown fences defensively."""
    raw = await generate_text(prompt, temperature, json_mode=True)
    # Strip ```json ... ``` fences (belt-and-suspenders; JSON mode usually omits them)
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
