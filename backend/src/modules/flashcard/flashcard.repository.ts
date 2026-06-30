import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FlashcardSet, FlashcardSetDocument, FlashcardSetStatus } from './schemas/flashcard.schema';

@Injectable()
export class FlashcardRepository {
  constructor(
    @InjectModel(FlashcardSet.name) private readonly model: Model<FlashcardSetDocument>,
  ) {}

  async create(data: Partial<FlashcardSet>): Promise<FlashcardSetDocument> {
    return this.model.create(data);
  }

  async findById(setId: string): Promise<FlashcardSetDocument | null> {
    return this.model.findOne({ setId, deletedAt: null }).exec();
  }

  async findByStudentId(
    studentId: string,
    page: number,
    pageSize: number,
  ): Promise<{ items: FlashcardSetDocument[]; total: number }> {
    const [items, total] = await Promise.all([
      this.model
        .find({ studentId, deletedAt: null })
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .select('-cards')
        .exec(),
      this.model.countDocuments({ studentId, deletedAt: null }),
    ]);
    return { items, total };
  }

  async updateStatus(
    setId: string,
    status: FlashcardSetStatus,
    extra?: Partial<Pick<FlashcardSet, 'cards' | 'generationError'>>,
  ): Promise<void> {
    await this.model
      .updateOne({ setId }, { $set: { status, ...(extra ?? {}) } })
      .exec();
  }

  async softDelete(setId: string): Promise<void> {
    await this.model.updateOne({ setId }, { $set: { deletedAt: new Date() } }).exec();
  }
}
