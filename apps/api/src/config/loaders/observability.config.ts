// src/config/loaders/observability.config.ts
import { registerAs } from '@nestjs/config';
import { getValidatedEnv } from '../env/env.validation';
import type { ObservabilityConfig } from '../types/config.types';
import { freezeConfig } from '../utils/loader.utils';

export default registerAs('observability', (): ObservabilityConfig => {
  const env = getValidatedEnv();

  return freezeConfig({
    logLevel: env.LOG_LEVEL,
    logFormat: env.LOG_FORMAT,
    logColorize: env.LOG_COLORIZE,
    logTimestamp: env.LOG_TIMESTAMP,
    logFilePath: env.LOG_FILE_PATH,
    logMaxSizeBytes: env.LOG_MAX_SIZE_BYTES,
    logMaxFiles: env.LOG_MAX_FILES,
    sentryDsn: env.SENTRY_DSN ?? null,
    sentryTracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE,
    sentryEnvironment: env.SENTRY_ENVIRONMENT,
    metricsEnabled: env.METRICS_ENABLED,
    metricsPath: env.METRICS_PATH,
  });
});
