import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EarnedBadge, StudentProgress, StudentProgressDocument } from './schemas/progress.schema';

@Injectable()
export class AnalyticsRepository {
  constructor(
    @InjectModel(StudentProgress.name)
    private readonly progressModel: Model<StudentProgressDocument>,
  ) {}

  async findOrCreate(studentId: string): Promise<StudentProgressDocument> {
    const existing = await this.progressModel.findOne({ studentId }).exec();
    if (existing) return existing;
    return this.progressModel.create({ studentId });
  }

  async findByStudentId(studentId: string): Promise<StudentProgressDocument | null> {
    return this.progressModel.findOne({ studentId }).exec();
  }

  async incrementCounter(
    studentId: string,
    field:
      | 'totalQuizzesTaken'
      | 'totalDocumentsUploaded'
      | 'totalLessonsGenerated'
      | 'totalFlashcardSetsCreated'
      | 'totalFlashcardsReviewed',
  ): Promise<void> {
    await this.progressModel
      .updateOne({ studentId }, { $inc: { [field]: 1 } }, { upsert: true })
      .exec();
  }

  async incrementXp(studentId: string, amount: number): Promise<StudentProgressDocument> {
    return this.progressModel
      .findOneAndUpdate(
        { studentId },
        { $inc: { xpTotal: amount } },
        { upsert: true, new: true },
      )
      .exec() as Promise<StudentProgressDocument>;
  }

  async addBadges(studentId: string, badges: EarnedBadge[]): Promise<void> {
    if (!badges.length) return;
    await this.progressModel
      .updateOne({ studentId }, { $push: { badges: { $each: badges } } }, { upsert: true })
      .exec();
  }

  async updateAfterQuiz(
    studentId: string,
    topic: string,
    scorePercent: number,
  ): Promise<{ currentStreak: number; longestStreak: number }> {
    const progress = await this.findOrCreate(studentId);

    // Update streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastActive = progress.lastActiveDate ? new Date(progress.lastActiveDate) : null;
    if (lastActive) lastActive.setHours(0, 0, 0, 0);

    let newStreak = progress.currentStreak;
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (!lastActive || lastActive < yesterday) {
      newStreak = 1;
    } else if (lastActive.getTime() === yesterday.getTime()) {
      newStreak = progress.currentStreak + 1;
    }
    // If lastActive === today, streak stays the same

    // Update topic mastery using weighted average
    const existing = progress.topicMastery.find((t) => t.topic === topic);
    let updatedTopics = [...progress.topicMastery];

    if (existing) {
      const newAvg = Math.round(
        (existing.averageScore * existing.quizzesTaken + scorePercent) / (existing.quizzesTaken + 1),
      );
      // Mastery score: weighted blend of average (70%) and latest attempt (30%)
      const newMastery = Math.round(newAvg * 0.7 + scorePercent * 0.3);
      updatedTopics = updatedTopics.map((t) =>
        t.topic === topic
          ? { ...t, averageScore: newAvg, masteryScore: newMastery, quizzesTaken: t.quizzesTaken + 1, lastAttemptAt: new Date() }
          : t,
      );
    } else {
      updatedTopics.push({
        topic,
        masteryScore: Math.round(scorePercent * 0.7),
        quizzesTaken: 1,
        averageScore: scorePercent,
        lastAttemptAt: new Date(),
      });
    }

    const overallMastery = updatedTopics.length
      ? Math.round(updatedTopics.reduce((sum, t) => sum + t.masteryScore, 0) / updatedTopics.length)
      : 0;

    const newLongestStreak = Math.max(progress.longestStreak, newStreak);

    await this.progressModel.updateOne(
      { studentId },
      {
        $set: {
          topicMastery: updatedTopics,
          overallMasteryScore: overallMastery,
          currentStreak: newStreak,
          longestStreak: newLongestStreak,
          lastActiveDate: new Date(),
        },
        $inc: { totalQuizzesTaken: 1 },
      },
      { upsert: true },
    ).exec();

    return { currentStreak: newStreak, longestStreak: newLongestStreak };
  }
}
