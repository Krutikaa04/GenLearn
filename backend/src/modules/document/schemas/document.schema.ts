import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum DocumentStatus {
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  EMBEDDING = 'embedding',
  READY = 'ready',
  FAILED = 'failed',
}

export enum FileType {
  PDF = 'pdf',
  DOCX = 'docx',
  TXT = 'txt',
  MD = 'md',
}

@Schema({ timestamps: true, collection: 'documents' })
export class KnowledgeDocument {
  @Prop({ required: true, unique: true })
  documentId: string;

  @Prop({ required: true })
  studentId: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  originalFilename: string;

  @Prop({ enum: FileType, required: true })
  fileType: FileType;

  @Prop({ required: true })
  fileSizeBytes: number;

  @Prop({ required: true })
  storagePath: string;

  @Prop({ enum: DocumentStatus, default: DocumentStatus.UPLOADED })
  status: DocumentStatus;

  @Prop({ default: null })
  processingError: string | null;

  @Prop({ default: null })
  pageCount: number | null;

  @Prop({ default: 0 })
  chunkCount: number;

  @Prop({ default: null })
  deletedAt: Date | null;
}

export type KnowledgeDocumentDocument = KnowledgeDocument & Document;
export const KnowledgeDocumentSchema = SchemaFactory.createForClass(KnowledgeDocument);

KnowledgeDocumentSchema.index({ documentId: 1 }, { unique: true });
KnowledgeDocumentSchema.index({ studentId: 1, createdAt: -1 });
KnowledgeDocumentSchema.index({ studentId: 1, status: 1 });
KnowledgeDocumentSchema.index({ deletedAt: 1 });
