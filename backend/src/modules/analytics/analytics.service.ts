import { Injectable, NotFoundException } from '@nestjs/common';
import { AnalyticsRepository } from './analytics.repository';

@Injectable()
export class AnalyticsService {
  constructor(private readonly analyticsRepository: AnalyticsRepository) {}

  async getProgress(studentId: string) {
    const progress = await this.analyticsRepository.findByStudentId(studentId);
    if (!progress) {
      // Return empty progress for new students
      return {
        studentId,
        totalQuizzesTaken: 0,
        totalDocumentsUploaded: 0,
        totalLessonsGenerated: 0,
        totalFlashcardSetsCreated: 0,
        currentStreak: 0,
        longestStreak: 0,
        overallMasteryScore: 0,
        topicMastery: [],
        lastActiveDate: null,
      };
    }

    return {
      studentId: progress.studentId,
      totalQuizzesTaken: progress.totalQuizzesTaken,
      totalDocumentsUploaded: progress.totalDocumentsUploaded,
      totalLessonsGenerated: progress.totalLessonsGenerated,
      totalFlashcardSetsCreated: progress.totalFlashcardSetsCreated,
      currentStreak: progress.currentStreak,
      longestStreak: progress.longestStreak,
      overallMasteryScore: progress.overallMasteryScore,
      topicMastery: progress.topicMastery
        .sort((a, b) => b.masteryScore - a.masteryScore)
        .map((t) => ({
          topic: t.topic,
          masteryScore: t.masteryScore,
          averageScore: t.averageScore,
          quizzesTaken: t.quizzesTaken,
          lastAttemptAt: t.lastAttemptAt,
        })),
      lastActiveDate: progress.lastActiveDate,
    };
  }

  // Called internally after quiz submission
  async recordQuizResult(studentId: string, topic: string, scorePercent: number): Promise<void> {
    await this.analyticsRepository.updateAfterQuiz(studentId, topic, scorePercent);
  }

  async recordActivity(
    studentId: string,
    type: 'document' | 'lesson' | 'flashcard',
  ): Promise<void> {
    const fieldMap = {
      document: 'totalDocumentsUploaded',
      lesson: 'totalLessonsGenerated',
      flashcard: 'totalFlashcardSetsCreated',
    } as const;
    await this.analyticsRepository.incrementCounter(studentId, fieldMap[type]);
  }
}
