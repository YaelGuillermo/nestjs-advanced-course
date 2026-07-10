// src/infrastructure/health/types/health.types.ts
export type HealthIndicatorStatus = 'up' | 'down';
export type HealthReportStatus = 'ok' | 'error';
export type HealthCheckKind = 'liveness' | 'readiness' | 'full';

export interface HealthIndicatorResult {
  name: string;
  status: HealthIndicatorStatus;
  latencyMs: number;
  details?: unknown;
}

export interface HealthReport {
  status: HealthReportStatus;
  kind: HealthCheckKind;
  timestamp: string;
  uptimeSeconds: number;
  service: {
    name: string;
    version: string;
    nodeEnv: string;
  };
  checks: HealthIndicatorResult[];
}
