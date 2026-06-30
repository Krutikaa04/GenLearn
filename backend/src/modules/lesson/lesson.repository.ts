import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Lesson, LessonDocument, LessonStatus } from './schemas/lesson.schema';

@Injectable()
export class LessonRepository {
  constructor(
    @InjectModel(Lesson.name) private readonly lessonModel: Model<LessonDocument>,
  ) {}

  async create(data: Partial<Lesson>): Promise<LessonDocument> {
    return this.lessonModel.create(data);
  }

  async findById(lessonId: string): Promise<LessonDocument | null> {
    return this.lessonModel.findOne({ lessonId, deletedAt: null }).exec();
  }

  async findByStudentId(
    studentId: string,
    page: number,
    pageSize: number,
  ): Promise<{ items: LessonDocument[]; total: number }> {
    const [items, total] = await Promise.all([
      this.lessonModel
        .find({ studentId, deletedAt: null })
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .select('-sections')
        .exec(),
      this.lessonModel.countDocuments({ studentId, deletedAt: null }),
    ]);
    return { items, total };
  }

  async updateStatus(
    lessonId: string,
    status: LessonStatus,
    extra?: Partial<Pick<Lesson, 'title' | 'summary' | 'sections' | 'keyTakeaways' | 'estimatedReadMinutes' | 'generationError'>>,
  ): Promise<void> {
    await this.lessonModel
      .updateOne({ lessonId }, { $set: { status, ...(extra ?? {}) } })
      .exec();
  }

  async softDelete(lessonId: string): Promise<void> {
    await this.lessonModel
      .updateOne({ lessonId }, { $set: { deletedAt: new Date() } })
      .exec();
  }
}
