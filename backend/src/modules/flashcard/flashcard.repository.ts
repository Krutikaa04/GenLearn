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

  async reviewCard(
    setId: string,
    cardId: string,
    easeFactor: number,
    interval: number,
    repetitions: number,
    nextReviewAt: Date,
  ): Promise<void> {
    await this.model.updateOne(
      { setId, 'cards.cardId': cardId },
      {
        $set: {
          'cards.$.easeFactor': easeFactor,
          'cards.$.interval': interval,
          'cards.$.repetitions': repetitions,
          'cards.$.nextReviewAt': nextReviewAt,
        },
      },
    ).exec();
  }

  async getDueCards(studentId: string): Promise<{ setId: string; setTitle: string; card: any }[]> {
    const now = new Date();
    const sets = await this.model.find({
      studentId,
      deletedAt: null,
      status: FlashcardSetStatus.READY,
      'cards.nextReviewAt': { $lte: now },
    }).exec();

    const due: { setId: string; setTitle: string; card: any }[] = [];
    for (const set of sets) {
      for (const card of set.cards) {
        if (card.nextReviewAt && card.nextReviewAt <= now) {
          due.push({ setId: set.setId, setTitle: set.title, card });
        }
      }
    }
    return due;
  }
}
