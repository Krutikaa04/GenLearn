/** Structural subset of StudentProgress needed to evaluate badge predicates. */
export interface BadgeCheckableProgress {
  totalQuizzesTaken: number;
  totalFlashcardsReviewed: number;
  currentStreak: number;
  overallMasteryScore: number;
  topicMastery: Array<{ masteryScore: number }>;
}

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  check: (progress: BadgeCheckableProgress) => boolean;
}

export const BADGE_CATALOG: BadgeDefinition[] = [
  {
    id: 'first-quiz',
    name: 'First Steps',
    description: 'Complete your first quiz',
    icon: 'Footprints',
    check: (p) => p.totalQuizzesTaken >= 1,
  },
  {
    id: 'streak-7',
    name: 'Week Warrior',
    description: 'Reach a 7-day study streak',
    icon: 'Flame',
    check: (p) => p.currentStreak >= 7,
  },
  {
    id: 'streak-30',
    name: 'Unstoppable',
    description: 'Reach a 30-day study streak',
    icon: 'Flame',
    check: (p) => p.currentStreak >= 30,
  },
  {
    id: 'topic-master',
    name: 'Topic Master',
    description: 'Reach 80% mastery in any topic',
    icon: 'Award',
    check: (p) => p.topicMastery.some((t) => t.masteryScore >= 80),
  },
  {
    id: 'flashcard-100',
    name: 'Card Shark',
    description: 'Review 100 flashcards',
    icon: 'Layers',
    check: (p) => p.totalFlashcardsReviewed >= 100,
  },
  {
    id: 'overall-mastery-70',
    name: 'Well Rounded',
    description: 'Reach 70% overall mastery',
    icon: 'Trophy',
    check: (p) => p.overallMasteryScore >= 70,
  },
];
