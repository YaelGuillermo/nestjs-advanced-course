// src/config/loaders/behavior.config.ts
import { registerAs } from '@nestjs/config';
import { getValidatedEnv } from '../env/env.validation';
import type { BehaviorConfig } from '../types/config.types';
import { freezeConfig, requiredEnvValue } from '../utils/loader.utils';

export default registerAs('behavior', (): BehaviorConfig => {
  const env = getValidatedEnv();

  return freezeConfig({
    requestTimeoutMs: env.REQUEST_TIMEOUT_MS,
    requestBodyLimitBytes: env.REQUEST_BODY_LIMIT_BYTES,
    responseValidationEnabled: env.RESPONSE_VALIDATION_ENABLED,
    sessionSecret: requiredEnvValue(env.SESSION_SECRET, 'SESSION_SECRET'),
    sessionMaxAgeMs: env.SESSION_MAX_AGE_MS,
    sessionCookieSecure: env.SESSION_COOKIE_SECURE,
    sessionCookieHttpOnly: env.SESSION_COOKIE_HTTP_ONLY,
    sessionCookieSameSite: env.SESSION_COOKIE_SAME_SITE,
  });
});
