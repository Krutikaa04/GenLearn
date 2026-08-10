import { HttpException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

export interface ProcessDocumentPayload {
  documentId: string;
  studentId: string;
  fileContent: string;
  fileType: string;
}

export interface ProcessDocumentResult {
  chunkCount: number;
  pageCount: number | null;
}

export interface GenerateLessonPayload {
  lessonId: string;
  studentId: string;
  topic: string;
  difficulty: string;
  documentIds: string[];
}

export interface LessonSection {
  heading: string;
  content: string;
  keyPoints: string[];
  codeExample: string | null;
}

export interface GenerateLessonResult {
  title: string;
  summary: string;
  sections: LessonSection[];
  keyTakeaways: string[];
  estimatedReadMinutes: number;
}

export interface GenerateQuizPayload {
  quizId: string;
  studentId: string;
  topic: string;
  difficulty: string;
  questionCount: number;
  documentIds: string[];
  challengeMode?: boolean;
  challengeTopics?: string[];
  timeLimitMinutes?: number;
  adaptiveFocus?: {
    purpose: string;
    targetConcepts: string[];
    misconceptionsToProbe: string[];
    conceptsToReduce: string[];
  };
}

export interface QuizQuestion {
  questionId: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface GenerateQuizResult {
  title: string;
  questions: QuizQuestion[];
}

export interface GenerateFlashcardsPayload {
  setId: string;
  studentId: string;
  sourceType: string;
  sourceId: string;
  count: number;
}

export interface FlashcardItem {
  cardId: string;
  front: string;
  back: string;
  hint: string | null;
}

export interface GenerateFlashcardsResult {
  cards: FlashcardItem[];
}

export interface RagQueryPayload {
  question: string;
  studentId: string;
  documentIds: string[];
}

export interface RagQueryResult {
  answer: string;
  grounded: boolean;
  sources: Array<{
    chunkId: string;
    documentId: string;
    pageNumber: number | null;
    heading: string | null;
    excerpt: string;
  }>;
}

export interface TutorChatPayload {
  studentId: string;
  topic: string;
  message: string;
  conversationHistory: Array<{ role: string; content: string }>;
  documentIds?: string[];
  studentContext?: Record<string, unknown>;
}

export interface TutorChatResult {
  reply: string;
  sources: unknown[];
  followUpSuggestions: string[];
}

export interface TopicMasteryInput {
  topic: string;
  masteryScore: number;
}

export interface GenerateStudyPlanPayload {
  userId: string;
  goal: string;
  targetDate: string;
  topics: string[];
  masteryData: TopicMasteryInput[];
  hoursPerDay: number;
}

export interface StudyTask {
  type: string;
  topic: string;
  durationMinutes: number;
  priority: string;
  rationale: string;
}

export interface StudyDay {
  day: number;
  date: string;
  tasks: StudyTask[];
  totalMinutes: number;
}

export interface GenerateStudyPlanResult {
  title: string;
  summary: string;
  plan: StudyDay[];
}

@Injectable()
export class AiGatewayService {
  private readonly logger = new Logger(AiGatewayService.name);
  private readonly baseUrl: string;
  private readonly internalKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('AI_SERVICE_URL', 'http://ai-service:8000');
    this.internalKey = this.configService.getOrThrow<string>('INTERNAL_API_KEY');
  }

  async processDocument(payload: ProcessDocumentPayload): Promise<ProcessDocumentResult> {
    return this.post<ProcessDocumentResult>('/ai/v1/documents/process', payload);
  }

  async generateLesson(payload: GenerateLessonPayload): Promise<GenerateLessonResult> {
    return this.post<GenerateLessonResult>('/ai/v1/lessons/generate', payload);
  }

  async generateQuiz(payload: GenerateQuizPayload): Promise<GenerateQuizResult> {
    return this.post<GenerateQuizResult>('/ai/v1/quizzes/generate', payload);
  }

  async generateFlashcards(payload: GenerateFlashcardsPayload): Promise<GenerateFlashcardsResult> {
    return this.post<GenerateFlashcardsResult>('/ai/v1/flashcards/generate', payload);
  }

  async ragQuery(payload: RagQueryPayload): Promise<RagQueryResult> {
    return this.post<RagQueryResult>('/ai/v1/rag/query', payload);
  }

  async tutorChat(payload: TutorChatPayload): Promise<TutorChatResult> {
    return this.post<TutorChatResult>('/ai/v1/tutor/chat', payload);
  }

  async generateStudyPlan(payload: GenerateStudyPlanPayload): Promise<GenerateStudyPlanResult> {
    return this.post<GenerateStudyPlanResult>('/ai/v1/studyplan/generate', payload);
  }

  /**
   * Lightweight reachability probe for the ai-service. Hits its `/health`
   * endpoint (no LLM call, no cost) so the backend can report AI availability
   * without waiting for a user to click a feature. Returns a category rather
   * than throwing so callers (e.g. the health controller) can degrade cleanly.
   */
  async checkHealth(): Promise<{ reachable: boolean; detail: string }> {
    try {
      await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/health`, { timeout: 5_000 }),
      );
      return { reachable: true, detail: 'ok' };
    } catch (err) {
      return { reachable: false, detail: this.classifyNetworkError(err as AxiosError).code };
    }
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    // The ai-service runs on a Render free instance that sleeps after ~15 min
    // idle and takes ~50s to cold-start. A generous timeout keeps that first
    // request (cold start + generation) from aborting mid-flight.
    const timeout = 180_000;
    let lastNetworkErr: AxiosError | undefined;

    // At most two attempts, and only a *connection-level* failure (the request
    // never reached the service, so nothing was generated) is retried — this
    // rides out a cold start without ever duplicating an LLM generation. An
    // HTTP error response (the service processed the request) is never retried.
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await firstValueFrom(
          this.httpService.post<T>(`${this.baseUrl}${path}`, body, {
            headers: { 'X-Internal-Key': this.internalKey },
            timeout,
          }),
        );
        return response.data;
      } catch (err) {
        const axiosErr = err as AxiosError;
        if (axiosErr.response) {
          // The service answered — surface the real failure category and stop.
          throw this.mapResponseError(path, axiosErr);
        }
        lastNetworkErr = axiosErr;
        const { retryable } = this.classifyNetworkError(axiosErr);
        if (retryable && attempt === 1) {
          this.logger.warn(
            `AI Platform ${path} unreachable (${axiosErr.code ?? 'network'}) — retrying once after cold-start`,
          );
          continue;
        }
        break;
      }
    }

    const { code, message, status } = this.classifyNetworkError(lastNetworkErr);
    this.logger.error(`AI Platform ${path} unreachable`, lastNetworkErr?.message);
    throw new HttpException({ code, message }, status);
  }

  /**
   * Maps an HTTP error *from the ai-service* to a specific, safe category so the
   * frontend can tell the user what actually went wrong instead of a blanket
   * "AI service down". The ai-service forwards the provider's status (401 auth,
   * 429 rate limit, 504 timeout, 503 provider outage); anything else is a
   * generic generation failure. No provider payloads or secrets are exposed.
   */
  private mapResponseError(path: string, err: AxiosError): HttpException {
    const status = err.response!.status;
    this.logger.error(`AI Platform ${path} failed: ${status}`, err.response!.data);

    switch (status) {
      case 401:
      case 403:
        return new HttpException(
          { code: 'AI_AUTH_FAILED', message: 'AI provider authentication failed' },
          502,
        );
      case 429:
        return new HttpException(
          { code: 'AI_RATE_LIMITED', message: 'AI provider is rate limited — please try again shortly' },
          503,
        );
      case 504:
        return new HttpException(
          { code: 'AI_TIMEOUT', message: 'The AI request took too long — please try again' },
          504,
        );
      case 503:
        return new ServiceUnavailableException({
          code: 'AI_PROVIDER_UNAVAILABLE',
          message: 'The AI provider is temporarily unavailable — please try again shortly',
        });
      case 422:
        return new HttpException(
          { code: 'AI_RESPONSE_MALFORMED', message: 'The AI returned an unusable response — please try again' },
          502,
        );
      default:
        return new HttpException(
          { code: 'AI_GENERATION_FAILED', message: 'AI service returned an error' },
          502,
        );
    }
  }

  /** Classifies a connection-level failure (no HTTP response received). */
  private classifyNetworkError(err?: AxiosError): {
    code: string;
    message: string;
    status: number;
    retryable: boolean;
  } {
    // Axios timeout: request sent but no response within the window.
    if (err?.code === 'ECONNABORTED' || err?.code === 'ETIMEDOUT') {
      return {
        code: 'AI_TIMEOUT',
        message: 'The AI service did not respond in time — please try again',
        status: 504,
        retryable: true,
      };
    }
    // Connection refused / DNS failure / reset: the service is down or waking.
    return {
      code: 'AI_SERVICE_UNAVAILABLE',
      message: 'AI service is temporarily unavailable — please try again shortly',
      status: 503,
      retryable: true,
    };
  }
}
