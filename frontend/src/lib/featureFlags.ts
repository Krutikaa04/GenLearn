/**
 * Adaptive-intelligence rollout flags. All default OFF so the existing
 * app behaves identically until a flag is explicitly enabled at build time.
 */
export const featureFlags = {
  behaviorTelemetry: import.meta.env.VITE_BEHAVIOR_TELEMETRY_ENABLED === 'true',
} as const;
