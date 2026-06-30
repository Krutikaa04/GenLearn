import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import { DocumentRepository } from './document.repository';
import { StorageService } from './storage.service';
import { AiGatewayService } from '../ai-gateway/ai-gateway.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { DocumentStatus, FileType } from './schemas/document.schema';
import { DocumentAskDto } from './dto/document-ask.dto';
import {
  DOCUMENT_PROCESSING_QUEUE,
  DocumentProcessingJob,
} from './workers/document-processor.processor';

const MIME_TO_FILETYPE: Record<string, FileType> = {
  'application/pdf': FileType.PDF,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': FileType.DOCX,
  'text/plain': FileType.TXT,
  'text/markdown': FileType.MD,
};

const MAX_DOCUMENTS_PER_STUDENT = 50;
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);

  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly storageService: StorageService,
    private readonly aiGateway: AiGatewayService,
    private readonly analyticsService: AnalyticsService,
    @InjectQueue(DOCUMENT_PROCESSING_QUEUE) private readonly processingQueue: Queue,
  ) {}

  async upload(studentId: string, file: Express.Multer.File, title?: string) {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException({ code: 'FILE_TOO_LARGE', message: 'File size exceeds 20 MB limit' });
    }

    const fileType = MIME_TO_FILETYPE[file.mimetype];
    if (!fileType) {
      throw new BadRequestException({ code: 'INVALID_FILE_TYPE', message: 'File type not supported. Accepted: PDF, DOCX, TXT, MD' });
    }

    const count = await this.documentRepository.countByStudentId(studentId);
    if (count >= MAX_DOCUMENTS_PER_STUDENT) {
      throw new UnprocessableEntityException({
        code: 'DOCUMENT_LIMIT_REACHED',
        message: `Document limit of ${MAX_DOCUMENTS_PER_STUDENT} reached`,
      });
    }

    const documentId = uuidv4();
    const storagePath = await this.storageService.saveFile(file, studentId, documentId);

    const document = await this.documentRepository.create({
      documentId,
      studentId,
      title: title || file.originalname,
      originalFilename: file.originalname,
      fileType,
      fileSizeBytes: file.size,
      storagePath,
      status: DocumentStatus.UPLOADED,
    });

    const jobData: DocumentProcessingJob = { documentId, studentId, storagePath, fileType };
    await this.processingQueue.add('process', jobData, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 100,
    });

    this.logger.log(`Document ${documentId} uploaded and queued for processing`);
    this.analyticsService.recordActivity(studentId, 'document').catch(() => {});

    return {
      documentId: document.documentId,
      status: document.status,
      title: document.title,
      fileType: document.fileType,
      fileSizeBytes: document.fileSizeBytes,
      pollUrl: `/api/v1/documents/${documentId}/status`,
    };
  }

  async findAll(studentId: string, page = 1, pageSize = 20) {
    const { items, total } = await this.documentRepository.findByStudentId(studentId, page, pageSize);
    return {
      data: items.map((d) => this.serializeDocument(d)),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findOne(documentId: string, studentId: string) {
    const doc = await this.findAndVerifyOwnership(documentId, studentId);
    return this.serializeDocument(doc);
  }

  async getStatus(documentId: string, studentId: string) {
    const doc = await this.findAndVerifyOwnership(documentId, studentId);
    return {
      documentId: doc.documentId,
      status: doc.status,
      chunkCount: doc.chunkCount,
      pageCount: doc.pageCount,
      processingError: doc.processingError,
    };
  }

  async delete(documentId: string, studentId: string): Promise<void> {
    const doc = await this.findAndVerifyOwnership(documentId, studentId);

    await this.documentRepository.softDelete(documentId);
    await this.documentRepository.deleteChunksByDocumentId(documentId);

    // Best-effort file deletion — don't fail the request if it fails
    this.storageService.deleteFile(doc.storagePath).catch((err) =>
      this.logger.warn(`File cleanup failed for ${documentId}: ${(err as Error).message}`),
    );
  }

  async ask(documentId: string, studentId: string, dto: DocumentAskDto) {
    const doc = await this.findAndVerifyOwnership(documentId, studentId);

    if (doc.status !== DocumentStatus.READY) {
      const code =
        doc.status === DocumentStatus.FAILED
          ? 'DOCUMENT_PROCESSING_FAILED'
          : 'DOCUMENT_NOT_READY';
      const message =
        doc.status === DocumentStatus.FAILED
          ? 'Document processing failed — please re-upload'
          : 'Document is still being processed';
      throw new UnprocessableEntityException({ code, message });
    }

    return this.aiGateway.ragQuery({
      question: dto.question,
      studentId,
      documentIds: [documentId],
    });
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async findAndVerifyOwnership(documentId: string, studentId: string) {
    const doc = await this.documentRepository.findById(documentId);
    if (!doc) {
      throw new NotFoundException({ code: 'DOCUMENT_NOT_FOUND', message: 'Document not found' });
    }
    if (doc.studentId !== studentId) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Access denied' });
    }
    return doc;
  }

  private serializeDocument(doc: any) {
    return {
      documentId: doc.documentId,
      title: doc.title,
      originalFilename: doc.originalFilename,
      fileType: doc.fileType,
      fileSizeBytes: doc.fileSizeBytes,
      status: doc.status,
      chunkCount: doc.chunkCount,
      pageCount: doc.pageCount,
      processingError: doc.processingError,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
