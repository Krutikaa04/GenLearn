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

  private async post<T>(path: string, body: unknown): Promise<T> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<T>(`${this.baseUrl}${path}`, body, {
          headers: { 'X-Internal-Key': this.internalKey },
          timeout: 120_000,
        }),
      );
      return response.data;
    } catch (err) {
      const axiosErr = err as AxiosError;
      if (axiosErr.response) {
        this.logger.error(`AI Platform ${path} failed: ${axiosErr.response.status}`, axiosErr.response.data);
        throw new HttpException(
          { code: 'AI_GENERATION_FAILED', message: 'AI service returned an error' },
          502,
        );
      }
      this.logger.error(`AI Platform ${path} unreachable`, axiosErr.message);
      throw new ServiceUnavailableException({ code: 'AI_PLATFORM_UNAVAILABLE', message: 'AI service is temporarily unavailable' });
    }
  }
}
