// src/config/loaders/queue.config.ts
import { registerAs } from '@nestjs/config';
import { getValidatedEnv } from '../env/env.validation';
import type { QueueConfig } from '../types/config.types';
import { freezeConfig } from '../utils/loader.utils';

export default registerAs('queue', (): QueueConfig => {
  const env = getValidatedEnv();

  return freezeConfig({
    prefix: env.QUEUE_PREFIX,
    defaultAttempts: env.QUEUE_DEFAULT_ATTEMPTS,
    defaultBackoffMs: env.QUEUE_DEFAULT_BACKOFF_MS,
  });
});
