import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { analyticsApi } from '../api/analytics.api';
import { XpToast } from '../components/gamification/XpToast';

interface EarnedBadge {
  badgeId: string;
  earnedAt: string;
  name: string;
  description: string;
  icon: string;
}

interface ProgressWithGamification {
  xpTotal: number;
  level: number;
  xpToNextLevel: number;
  badges: EarnedBadge[];
}

function useProgressQuery() {
  return useQuery<ProgressWithGamification>({
    queryKey: ['progress'],
    queryFn: () => analyticsApi.getProgress().then((r) => r.data.data),
    refetchInterval: 20_000,
  });
}

/** Read-only access to XP/level/badges. Safe to call from multiple components — shares one cached query. */
export function useGamification() {
  const { data, isLoading } = useProgressQuery();

  return {
    xpTotal: data?.xpTotal ?? 0,
    level: data?.level ?? 1,
    xpToNextLevel: data?.xpToNextLevel ?? 100,
    badges: data?.badges ?? [],
    isLoading,
  };
}

/**
 * Fires celebratory toasts whenever XP or badges increase. Mount exactly once
 * (in AppLayout) — the diffing uses local refs, so mounting it more than once
 * would fire duplicate toasts for the same event.
 */
export function useGamificationToasts() {
  const { data } = useProgressQuery();
  const prevXp = useRef<number | null>(null);
  const prevBadgeIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!data) return;

    if (prevXp.current !== null) {
      if (data.xpTotal > prevXp.current) {
        const gained = data.xpTotal - prevXp.current;
        toast.custom((t) => XpToast({ toast: t, xpGained: gained }));
      }

      const newBadges = data.badges.filter((b) => !prevBadgeIds.current.has(b.badgeId));
      for (const badge of newBadges) {
        toast.custom((t) => XpToast({ toast: t, badgeName: badge.name }));
      }
    }

    prevXp.current = data.xpTotal;
    prevBadgeIds.current = new Set(data.badges.map((b) => b.badgeId));
  }, [data]);
}
