// src/config/loaders/redis.config.ts
import { registerAs } from '@nestjs/config';
import { getValidatedEnv } from '../env/env.validation';
import type { RedisConfig } from '../types/config.types';
import { freezeConfig } from '../utils/loader.utils';

export default registerAs('redis', (): RedisConfig => {
  const env = getValidatedEnv();

  return freezeConfig({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD ?? null,
    db: env.REDIS_DB,
    ttlSeconds: env.REDIS_TTL_SECONDS,
    keyPrefix: env.REDIS_KEY_PREFIX,
    maxRetries: env.REDIS_MAX_RETRIES,
    connectTimeoutMs: env.REDIS_CONNECT_TIMEOUT_MS,
  });
});
