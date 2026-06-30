import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Quiz, QuizDocument, QuizStatus } from './schemas/quiz.schema';

@Injectable()
export class QuizRepository {
  constructor(
    @InjectModel(Quiz.name) private readonly quizModel: Model<QuizDocument>,
  ) {}

  async create(data: Partial<Quiz>): Promise<QuizDocument> {
    return this.quizModel.create(data);
  }

  async findById(quizId: string): Promise<QuizDocument | null> {
    return this.quizModel.findOne({ quizId, deletedAt: null }).exec();
  }

  async findByIdWithAnswers(quizId: string): Promise<QuizDocument | null> {
    return this.quizModel
      .findOne({ quizId, deletedAt: null })
      .select('+questions.correctIndex +questions.explanation')
      .exec();
  }

  async findByStudentId(
    studentId: string,
    page: number,
    pageSize: number,
  ): Promise<{ items: QuizDocument[]; total: number }> {
    const [items, total] = await Promise.all([
      this.quizModel
        .find({ studentId, deletedAt: null })
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .select('-questions -answers')
        .exec(),
      this.quizModel.countDocuments({ studentId, deletedAt: null }),
    ]);
    return { items, total };
  }

  async updateStatus(
    quizId: string,
    status: QuizStatus,
    extra?: Partial<Pick<Quiz, 'title' | 'questions' | 'generationError'>>,
  ): Promise<void> {
    await this.quizModel
      .updateOne({ quizId }, { $set: { status, ...(extra ?? {}) } })
      .exec();
  }

  async submitAnswers(
    quizId: string,
    answers: Quiz['answers'],
    score: number,
  ): Promise<void> {
    await this.quizModel
      .updateOne(
        { quizId },
        {
          $set: {
            answers,
            score,
            totalQuestions: answers.length,
            status: QuizStatus.SUBMITTED,
            submittedAt: new Date(),
          },
        },
      )
      .exec();
  }

  async softDelete(quizId: string): Promise<void> {
    await this.quizModel
      .updateOne({ quizId }, { $set: { deletedAt: new Date() } })
      .exec();
  }
}
