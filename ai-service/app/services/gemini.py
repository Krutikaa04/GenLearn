"""Gemini client — single shared instance with retry logic."""
import json
import logging
import math
import re
from fastapi import HTTPException
from google import genai
from google.genai import types
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception
from app.config import settings

logger = logging.getLogger(__name__)

_client = genai.Client(api_key=settings.GEMINI_API_KEY)


def _is_transient(exc: BaseException) -> bool:
    """Whether a provider error is worth retrying. Client errors (4xx) — above
    all 429 rate limits — must NOT be retried: they won't succeed on retry and
    retrying a 429 just burns more quota and deepens the rate limit. Retry only
    transient failures (5xx, network, timeouts) and non-API errors like JSON
    parse failures (which have no status and mean "regenerate")."""
    status = getattr(exc, "code", None) or getattr(exc, "status_code", None)
    if isinstance(status, int) and 400 <= status < 500:
        return False
    return True


def raise_provider_error(exc: Exception) -> "HTTPException":
    """Translate a Gemini/provider exception into an HTTPException whose status
    encodes the failure *category*, so the backend can show the user a specific
    reason instead of a blanket error. Never includes the API key or raw
    provider payloads — only a short, safe category label.
    """
    # google-genai raises APIError subclasses carrying an HTTP `.code`.
    status = getattr(exc, "code", None) or getattr(exc, "status_code", None)
    msg = str(exc).lower()

    # Log the real provider error server-side (type + status + message) so
    # failures are diagnosable from the ai-service logs. Gemini error messages
    # carry the model/status, not the API key, so this is safe to log.
    logger.error("Gemini provider error [%s] status=%s: %s", type(exc).__name__, status, exc)

    if status in (401, 403) or "api key" in msg or "unauthenticated" in msg or "permission" in msg:
        return HTTPException(status_code=401, detail="AI provider authentication failed")
    if status == 429 or "quota" in msg or "rate limit" in msg or "resource_exhausted" in msg:
        return HTTPException(status_code=429, detail="AI provider rate limit reached")
    if status == 404 or "not found" in msg or "model" in msg and "support" in msg:
        return HTTPException(status_code=502, detail="AI provider model unavailable")
    if "deadline" in msg or "timeout" in msg or "timed out" in msg:
        return HTTPException(status_code=504, detail="AI provider request timed out")
    if isinstance(status, int) and 500 <= status < 600:
        return HTTPException(status_code=503, detail="AI provider temporarily unavailable")
    return HTTPException(status_code=502, detail="AI generation failed")

# gemini-2.5-flash runs an internal "thinking" pass before responding, which
# adds ~10-40s of latency per call. Our prompts are explicit and structured, so
# that reasoning buys little — disabling it (budget 0) is the single biggest
# speed-up for quiz/flashcard/lesson/tutor/study-plan generation.
_NO_THINKING = types.ThinkingConfig(thinking_budget=0)


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception(_is_transient),
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
    retry=retry_if_exception(_is_transient),
    reraise=True,
)
async def generate_json(prompt: str, temperature: float = 0.3) -> dict:
    """Generate JSON. Requests JSON output mode; still strips markdown fences defensively."""
    raw = await generate_text(prompt, temperature, json_mode=True)
    # Strip ```json ... ``` fences (belt-and-suspenders; JSON mode usually omits them)
    cleaned = re.sub(r"^```(?:json)?\s*", "", raw.strip(), flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned.strip())
    return json.loads(cleaned)


def _normalize(values: list[float]) -> list[float]:
    # gemini-embedding-001 returns already-normalized vectors only at its full
    # 3072 dims; when we request a reduced output size (768) the vector must be
    # L2-normalized ourselves for cosine/dot-product similarity to be correct.
    norm = math.sqrt(sum(v * v for v in values))
    if norm == 0:
        return values
    return [v / norm for v in values]


async def embed_text(text: str) -> list[float]:
    result = await _client.aio.models.embed_content(
        model=settings.EMBEDDING_MODEL,
        contents=text,
        config=types.EmbedContentConfig(
            task_type="RETRIEVAL_DOCUMENT",
            output_dimensionality=settings.EMBEDDING_DIMENSIONS,
        ),
    )
    return _normalize(result.embeddings[0].values)


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception(_is_transient),
    reraise=True,
)
async def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed many texts in a single API request. Document ingestion used to fire
    one request per chunk (a 40-chunk PDF = 40 requests), which trips free-tier
    per-minute rate limits instantly; batching collapses that to one request."""
    result = await _client.aio.models.embed_content(
        model=settings.EMBEDDING_MODEL,
        contents=texts,
        config=types.EmbedContentConfig(
            task_type="RETRIEVAL_DOCUMENT",
            output_dimensionality=settings.EMBEDDING_DIMENSIONS,
        ),
    )
    return [_normalize(e.values) for e in result.embeddings]


async def embed_query(text: str) -> list[float]:
    result = await _client.aio.models.embed_content(
        model=settings.EMBEDDING_MODEL,
        contents=text,
        config=types.EmbedContentConfig(
            task_type="RETRIEVAL_QUERY",
            output_dimensionality=settings.EMBEDDING_DIMENSIONS,
        ),
    )
    return _normalize(result.embeddings[0].values)
