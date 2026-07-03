import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Footprints, Flame, Award, Layers, Trophy, Lock, type LucideIcon } from 'lucide-react';
import { analyticsApi } from '../../api/analytics.api';
import { useGamification } from '../../hooks/useGamification';
import { Card } from '../ui/Card';
import { staggerContainer, staggerItem } from '../../lib/motion';

const ICONS: Record<string, LucideIcon> = { Footprints, Flame, Award, Layers, Trophy };

interface CatalogBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export function BadgeShowcase() {
  const { badges: earnedBadges } = useGamification();
  const { data, isLoading } = useQuery<CatalogBadge[]>({
    queryKey: ['badge-catalog'],
    queryFn: () => analyticsApi.getBadgeCatalog().then((r) => r.data.data),
    staleTime: Infinity,
  });

  if (isLoading) return null;

  const catalog = Array.isArray(data) ? data : [];

  const earnedIds = new Set(earnedBadges.map((b) => b.badgeId));

  return (
    <Card padding="lg">
      <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Badges</h3>
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 gap-3"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {catalog.map((badge) => {
          const earned = earnedIds.has(badge.id);
          const Icon = ICONS[badge.icon] ?? Award;
          return (
            <motion.div
              key={badge.id}
              variants={staggerItem}
              className="flex flex-col items-center text-center gap-1.5 rounded-xl border p-3"
              style={{
                background: earned ? 'var(--brand-light)' : 'var(--bg-subtle)',
                borderColor: earned ? 'transparent' : 'var(--border)',
                opacity: earned ? 1 : 0.55,
              }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: earned ? 'var(--brand)' : 'var(--bg-surface)' }}
              >
                {earned ? (
                  <Icon className="w-4.5 h-4.5 text-white" />
                ) : (
                  <Lock className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                )}
              </div>
              <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{badge.name}</p>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{badge.description}</p>
            </motion.div>
          );
        })}
      </motion.div>
    </Card>
  );
}
