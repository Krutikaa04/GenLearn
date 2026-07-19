# AI Architecture

The AI service is a FastAPI microservice (`ai-service/`) that wraps Google
Gemini. It is internal-only: the backend is its sole client, authenticated with
a shared secret (`INTERNAL_API_KEY`) sent as the `X-Internal-Key` header. All
routes are mounted under `/ai/v1`; a public `/health` endpoint is used for
platform probes.

Model configuration (`app/config.py`):

- Generation model: `MODEL_NAME` (default `gemini-2.5-flash`)
- Embedding model: `EMBEDDING_MODEL` (default `models/text-embedding-004`)

## Service layout

| File | Responsibility |
| --- | --- |
| `app/api/router.py` | Mounts routers: `tutor`, `lessons`, `quizzes`, `flashcards`, `rag`, `adaptive`, `documents`, `studyplan` |
| `app/services/gemini.py` | Gemini client — generation and embeddings |
| `app/services/text_extractor.py` | Extract text from PDF/DOCX/TXT/MD |
| `app/services/chunker.py` | Split extracted text into chunks |
| `app/services/retrieval.py` | Embed queries and run MongoDB vector search |
| `app/services/mongodb.py` | MongoDB access for chunks/vectors |
| `app/middleware/auth.py` | Validates the internal API key |

## AI request flow

```
Backend feature module
  → CognitiveEngineService            (backend, uniform generative API)
  → AiGatewayService                  (backend, HTTP transport + typed payloads)
  → POST /ai/v1/<capability>          (X-Internal-Key)
  → route builds prompt → (optional RAG retrieval) → gemini.py → Gemini API
  ← structured JSON result
```

Generative work that is slow (document processing, lesson/quiz/flashcard
generation) is executed by backend **BullMQ workers**, so the client sees an
immediate "generating" status and polls a `*/status` endpoint until the result
is `ready`. Interactive calls (tutor chat, document ask) are synchronous.

## RAG pipeline

1. **Ingestion** (on document upload): the backend stores the file and enqueues
   processing. The document-processor worker calls the AI service, which:
   - extracts text (`text_extractor.py`),
   - splits it into chunks (`chunker.py`),
   - embeds each chunk with `text-embedding-004`,
   - stores chunks + vectors in the `document_chunks` collection.
2. **Retrieval** (at generation/chat/ask time): the AI service embeds the query
   and uses MongoDB vector search (`retrieval.py`) to fetch the most relevant
   chunks for the requesting student's documents.
3. **Grounding**: retrieved chunks are injected into the prompt so the model
   answers from the learner's own material.

RAG-grounded generation is gated by the `RAG_GENERATION_ENABLED` flag (on both
backend and AI service).

## Prompt generation

Each route in `app/api/routes/` builds a task-specific prompt from the typed
request payload (topic, difficulty, question count, source document IDs, adaptive
focus, etc.) and, where applicable, the retrieved RAG context. Results are
requested in a structured shape that maps directly onto backend DTOs — for
example a lesson returns `title`, `summary`, `sections[]`, `keyTakeaways[]`,
`estimatedReadMinutes`; a quiz returns `title` and `questions[]` with
`correctIndex` and `explanation`.

## Adaptive generation input

For adaptive quizzes the backend passes an `adaptiveFocus` block
(`purpose`, `targetConcepts`, `misconceptionsToProbe`, `conceptsToReduce`)
derived from the learner model, so generated questions target the concepts the
planner selected. See [Adaptive Learning](AdaptiveLearning.md).

## Related documents
- [Architecture](Architecture.md)
- [Adaptive Learning](AdaptiveLearning.md)
- [API Reference](API.md)
