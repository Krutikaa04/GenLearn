import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { DocumentRepository } from '../document.repository';
import { AiGatewayService } from '../../ai-gateway/ai-gateway.service';
import { DocumentStatus } from '../schemas/document.schema';

export const DOCUMENT_PROCESSING_QUEUE = 'document-processing';

export interface DocumentProcessingJob {
  documentId: string;
  studentId: string;
  storagePath: string;
  fileType: string;
}

@Processor(DOCUMENT_PROCESSING_QUEUE)
export class DocumentProcessorWorker extends WorkerHost {
  private readonly logger = new Logger(DocumentProcessorWorker.name);

  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly aiGateway: AiGatewayService,
  ) {
    super();
  }

  async process(job: Job<DocumentProcessingJob>): Promise<void> {
    const { documentId, studentId, storagePath, fileType } = job.data;
    this.logger.log(`Processing document ${documentId} for student ${studentId}`);

    try {
      await this.documentRepository.updateStatus(documentId, DocumentStatus.PROCESSING);

      const result = await this.aiGateway.processDocument({
        documentId,
        studentId,
        storagePath,
        fileType,
      });

      await this.documentRepository.updateStatus(documentId, DocumentStatus.READY, {
        chunkCount: result.chunkCount,
        pageCount: result.pageCount,
      });

      this.logger.log(`Document ${documentId} processed: ${result.chunkCount} chunks`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown processing error';
      this.logger.error(`Document ${documentId} processing failed: ${message}`);

      await this.documentRepository.updateStatus(documentId, DocumentStatus.FAILED, {
        processingError: message,
      });
    }
  }
}
