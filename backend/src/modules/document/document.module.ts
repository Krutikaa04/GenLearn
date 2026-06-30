import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { KnowledgeDocument, KnowledgeDocumentSchema } from './schemas/document.schema';
import { DocumentChunk, DocumentChunkSchema } from './schemas/document-chunk.schema';
import { DocumentRepository } from './document.repository';
import { StorageService } from './storage.service';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';
import { DocumentProcessorWorker, DOCUMENT_PROCESSING_QUEUE } from './workers/document-processor.processor';
import { AiGatewayModule } from '../ai-gateway/ai-gateway.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: KnowledgeDocument.name, schema: KnowledgeDocumentSchema },
      { name: DocumentChunk.name, schema: DocumentChunkSchema },
    ]),
    BullModule.registerQueue({ name: DOCUMENT_PROCESSING_QUEUE }),
    AiGatewayModule,
  ],
  controllers: [DocumentController],
  providers: [DocumentRepository, StorageService, DocumentService, DocumentProcessorWorker],
  exports: [DocumentService, AiGatewayModule],
})
export class DocumentModule {}
