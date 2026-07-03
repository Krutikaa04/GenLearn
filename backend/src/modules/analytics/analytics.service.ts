import { Injectable, NotFoundException } from '@nestjs/common';
import { AnalyticsRepository } from './analytics.repository';
import { BADGE_CATALOG } from './gamification/badges.catalog';
import { levelForXp, xpForNextLevel, XP_REWARDS } from './gamification/xp.util';

function badgeMetadata(badgeId: string) {
  const def = BADGE_CATALOG.find((b) => b.id === badgeId);
  return { name: def?.name ?? badgeId, description: def?.description ?? '', icon: def?.icon ?? 'Award' };
}

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
        xpTotal: 0,
        level: levelForXp(0),
        xpToNextLevel: xpForNextLevel(0),
        badges: [],
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
      xpTotal: progress.xpTotal,
      level: levelForXp(progress.xpTotal),
      xpToNextLevel: xpForNextLevel(progress.xpTotal),
      badges: progress.badges.map((b) => ({
        badgeId: b.badgeId,
        earnedAt: b.earnedAt,
        ...badgeMetadata(b.badgeId),
      })),
    };
  }

  getBadgeCatalog() {
    return BADGE_CATALOG.map(({ id, name, description, icon }) => ({ id, name, description, icon }));
  }

  /** Single XP/badge entry point: increments XP, checks the badge catalog, persists newly-earned badges. */
  async awardXp(studentId: string, amount: number, reason: string) {
    const progress = await this.analyticsRepository.incrementXp(studentId, amount);

    const alreadyEarned = new Set(progress.badges.map((b) => b.badgeId));
    const newlyEarned = BADGE_CATALOG.filter((b) => !alreadyEarned.has(b.id) && b.check(progress));

    const newBadges = newlyEarned.map((b) => ({ badgeId: b.id, earnedAt: new Date() }));
    if (newBadges.length) {
      await this.analyticsRepository.addBadges(studentId, newBadges);
    }

    void reason; // retained for logging/debugging call sites; no persistence in v1 (no XP ledger)
    return { xpTotal: progress.xpTotal, newBadges };
  }

  async getWeakTopics(studentId: string) {
    const progress = await this.analyticsRepository.findByStudentId(studentId);
    if (!progress) return [];
    return progress.topicMastery
      .filter((t) => t.masteryScore < 60)
      .sort((a, b) => a.masteryScore - b.masteryScore)
      .map((t) => ({
        topic: t.topic,
        masteryScore: t.masteryScore,
        averageScore: t.averageScore,
        quizzesTaken: t.quizzesTaken,
      }));
  }

  // Called internally after quiz submission
  async recordQuizResult(studentId: string, topic: string, scorePercent: number): Promise<void> {
    const { currentStreak } = await this.analyticsRepository.updateAfterQuiz(studentId, topic, scorePercent);

    let xp: number = XP_REWARDS.QUIZ_BASE;
    if (scorePercent >= 80) xp += XP_REWARDS.QUIZ_HIGH_SCORE_BONUS;
    if (currentStreak === 7) xp += XP_REWARDS.STREAK_MILESTONE_7;
    else if (currentStreak === 30) xp += XP_REWARDS.STREAK_MILESTONE_30;

    await this.awardXp(studentId, xp, 'quiz_submitted');
  }

  async recordActivity(
    studentId: string,
    type: 'document' | 'lesson' | 'flashcard' | 'flashcard_review',
  ): Promise<void> {
    const fieldMap = {
      document: 'totalDocumentsUploaded',
      lesson: 'totalLessonsGenerated',
      flashcard: 'totalFlashcardSetsCreated',
      flashcard_review: 'totalFlashcardsReviewed',
    } as const;
    await this.analyticsRepository.incrementCounter(studentId, fieldMap[type]);
    await this.awardXp(studentId, XP_REWARDS[type], type);
  }
}
