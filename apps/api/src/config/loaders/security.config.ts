// src/config/loaders/security.config.ts
import { registerAs } from '@nestjs/config';
import { getValidatedEnv } from '../env/env.validation';
import type { SecurityConfig } from '../types/config.types';
import { freezeConfig } from '../utils/loader.utils';

export default registerAs('security', (): SecurityConfig => {
  const env = getValidatedEnv();

  return freezeConfig({
    corsAllowedOrigins: [...env.CORS_ALLOWED_ORIGINS],
    corsCredentials: env.CORS_CREDENTIALS,
    rateLimitTtlSeconds: env.RATE_LIMIT_TTL_SECONDS,
    rateLimitMaxRequests: env.RATE_LIMIT_MAX_REQUESTS,
    throttleTtlSeconds: env.THROTTLE_TTL_SECONDS,
    throttleLimit: env.THROTTLE_LIMIT,
  });
});
