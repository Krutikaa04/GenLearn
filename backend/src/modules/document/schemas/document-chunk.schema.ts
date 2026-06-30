import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'document_chunks', timestamps: { createdAt: true, updatedAt: false } })
export class DocumentChunk {
  @Prop({ required: true, unique: true })
  chunkId: string;

  @Prop({ required: true })
  documentId: string;

  @Prop({ required: true })
  studentId: string;

  @Prop({ required: true })
  content: string;

  // 768-dimensional embedding — excluded from default queries, queried via Atlas Vector Search
  @Prop({ type: [Number], default: [], select: false })
  embedding: number[];

  @Prop({ default: null })
  pageNumber: number | null;

  @Prop({ default: null })
  heading: string | null;

  @Prop({ required: true })
  chunkIndex: number;

  @Prop({ required: true })
  tokenCount: number;
}

export type DocumentChunkDocument = DocumentChunk & Document;
export const DocumentChunkSchema = SchemaFactory.createForClass(DocumentChunk);

DocumentChunkSchema.index({ chunkId: 1 }, { unique: true });
DocumentChunkSchema.index({ documentId: 1, chunkIndex: 1 });
DocumentChunkSchema.index({ studentId: 1 });
