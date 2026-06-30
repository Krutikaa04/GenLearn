import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  KnowledgeDocument,
  KnowledgeDocumentDocument,
  DocumentStatus,
} from './schemas/document.schema';
import { DocumentChunk, DocumentChunkDocument } from './schemas/document-chunk.schema';

@Injectable()
export class DocumentRepository {
  constructor(
    @InjectModel(KnowledgeDocument.name)
    private readonly documentModel: Model<KnowledgeDocumentDocument>,
    @InjectModel(DocumentChunk.name)
    private readonly chunkModel: Model<DocumentChunkDocument>,
  ) {}

  async create(data: Partial<KnowledgeDocument>): Promise<KnowledgeDocumentDocument> {
    return this.documentModel.create(data);
  }

  async findById(documentId: string): Promise<KnowledgeDocumentDocument | null> {
    return this.documentModel.findOne({ documentId, deletedAt: null }).exec();
  }

  async findByStudentId(
    studentId: string,
    page: number,
    pageSize: number,
  ): Promise<{ items: KnowledgeDocumentDocument[]; total: number }> {
    const [items, total] = await Promise.all([
      this.documentModel
        .find({ studentId, deletedAt: null })
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .exec(),
      this.documentModel.countDocuments({ studentId, deletedAt: null }),
    ]);
    return { items, total };
  }

  async countByStudentId(studentId: string): Promise<number> {
    return this.documentModel.countDocuments({ studentId, deletedAt: null });
  }

  async updateStatus(
    documentId: string,
    status: DocumentStatus,
    extra?: Partial<Pick<KnowledgeDocument, 'chunkCount' | 'pageCount' | 'processingError'>>,
  ): Promise<void> {
    await this.documentModel
      .updateOne({ documentId }, { $set: { status, ...(extra ?? {}) } })
      .exec();
  }

  async softDelete(documentId: string): Promise<void> {
    await this.documentModel
      .updateOne({ documentId }, { $set: { deletedAt: new Date() } })
      .exec();
  }

  async deleteChunksByDocumentId(documentId: string): Promise<void> {
    await this.chunkModel.deleteMany({ documentId }).exec();
  }
}
