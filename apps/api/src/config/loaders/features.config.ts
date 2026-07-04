// src/config/loaders/features.config.ts
import { registerAs } from '@nestjs/config';
import { getValidatedEnv } from '../env/env.validation';
import type { FeaturesConfig } from '../types/config.types';
import { freezeConfig } from '../utils/loader.utils';

export default registerAs('features', (): FeaturesConfig => {
  const env = getValidatedEnv();

  return freezeConfig({
    swaggerEnabled: env.SWAGGER_ENABLED,
    swaggerPath: env.SWAGGER_PATH,
    swaggerTitle: env.SWAGGER_TITLE,
    swaggerDescription: env.SWAGGER_DESCRIPTION,
    swaggerVersion: env.SWAGGER_VERSION,
    healthChecksEnabled: env.HEALTH_CHECKS_ENABLED,
    healthCheckPath: env.HEALTH_CHECK_PATH,
    healthCheckDetailsEnabled: env.HEALTH_CHECK_DETAILS_ENABLED,
    compressionEnabled: env.COMPRESSION_ENABLED,
    compressionThresholdBytes: env.COMPRESSION_THRESHOLD_BYTES,
    compressionLevel: env.COMPRESSION_LEVEL,
    cacheEnabled: env.CACHE_ENABLED,
    cacheTtlSeconds: env.CACHE_TTL_SECONDS,
  });
});
