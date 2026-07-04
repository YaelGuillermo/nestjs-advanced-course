// src/config/loaders/api.config.ts
import { registerAs } from '@nestjs/config';
import { getValidatedEnv } from '../env/env.validation';
import type { ApiConfig } from '../types/config.types';
import { freezeConfig } from '../utils/loader.utils';

export default registerAs('api', (): ApiConfig => {
  const env = getValidatedEnv();
  const routePrefix = env.API_ROUTE_PREFIX;
  const version = env.API_VERSION;

  return freezeConfig({
    routePrefix,
    version,
    fullPrefix: `${routePrefix}/${version}`,
    publicUrl: env.API_PUBLIC_URL ?? null,
  });
});
