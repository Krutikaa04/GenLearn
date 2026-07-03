import { ConfigService } from '@nestjs/config';

/**
 * Adaptive-intelligence rollout flags. All default OFF so the existing
 * application behaves identically until a flag is explicitly enabled.
 */
export type FeatureFlag =
  | 'BEHAVIOR_TELEMETRY_ENABLED'
  | 'ADAPTIVE_LEARNING_ENABLED'
  | 'RAG_GENERATION_ENABLED'
  | 'ADAPTIVE_QUIZ_GENERATION_ENABLED'
  | 'ADAPTIVE_LESSON_GENERATION_ENABLED';

export function isFeatureEnabled(config: ConfigService, flag: FeatureFlag): boolean {
  return config.get<string>(flag, 'false').toLowerCase() === 'true';
}
