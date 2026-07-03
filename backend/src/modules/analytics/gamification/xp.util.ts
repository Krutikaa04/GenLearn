/** Flat XP awarded per discrete activity/reason. Streak milestone bonuses are computed separately. */
export const XP_REWARDS = {
  document: 10,
  lesson: 15,
  flashcard: 10,
  flashcard_review: 2,
  QUIZ_BASE: 20,
  QUIZ_HIGH_SCORE_BONUS: 15,
  STREAK_MILESTONE_7: 50,
  STREAK_MILESTONE_30: 200,
} as const;

const XP_PER_LEVEL_BASE = 100;

/** Cumulative XP required to reach `level` (level 1 = 0 XP, level 2 = 100 XP, level 3 = 300 XP, ...). */
function thresholdForLevel(level: number): number {
  return (XP_PER_LEVEL_BASE * level * (level - 1)) / 2;
}

export function levelForXp(xp: number): number {
  let level = 1;
  while (thresholdForLevel(level + 1) <= xp) level++;
  return level;
}

export function xpForNextLevel(xp: number): number {
  const level = levelForXp(xp);
  return thresholdForLevel(level + 1) - xp;
}
