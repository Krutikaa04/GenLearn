import { levelForXp, xpForNextLevel } from './xp.util';

describe('xp.util', () => {
  describe('levelForXp', () => {
    it('returns level 1 at 0 XP', () => {
      expect(levelForXp(0)).toBe(1);
    });

    it('stays at level 1 just under the level-2 threshold', () => {
      expect(levelForXp(99)).toBe(1);
    });

    it('reaches level 2 exactly at its threshold (100 XP)', () => {
      expect(levelForXp(100)).toBe(2);
    });

    it('reaches level 3 exactly at its threshold (300 XP)', () => {
      expect(levelForXp(299)).toBe(2);
      expect(levelForXp(300)).toBe(3);
    });
  });

  describe('xpForNextLevel', () => {
    it('returns the full 100 XP needed from a fresh account', () => {
      expect(xpForNextLevel(0)).toBe(100);
    });

    it('returns the remaining XP needed mid-level', () => {
      expect(xpForNextLevel(50)).toBe(50);
    });

    it('returns the XP needed for the level after crossing a threshold', () => {
      expect(xpForNextLevel(100)).toBe(200);
    });
  });
});
