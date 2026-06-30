import { HttpException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

export interface ProcessDocumentPayload {
  documentId: string;
  studentId: string;
  storagePath: string;
  fileType: string;
}

export interface ProcessDocumentResult {
  chunkCount: number;
  pageCount: number | null;
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

  async ragQuery(payload: RagQueryPayload): Promise<RagQueryResult> {
    return this.post<RagQueryResult>('/ai/v1/rag/query', payload);
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
