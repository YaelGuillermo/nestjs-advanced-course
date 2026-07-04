// src/config/loaders/app.config.ts
import { registerAs } from '@nestjs/config';
import { getValidatedEnv } from '../env/env.validation';
import type { AppConfig } from '../types/config.types';
import { freezeConfig } from '../utils/loader.utils';

export default registerAs('app', (): AppConfig => {
  const env = getValidatedEnv();

  return freezeConfig({
    nodeEnv: env.NODE_ENV,
    name: env.APP_NAME,
    version: env.APP_VERSION,
    host: env.APP_HOST,
    port: env.APP_PORT,
    publicUrl: env.APP_PUBLIC_URL ?? null,
    frontendPublicUrl: env.FRONTEND_PUBLIC_URL,
    cookieDomain: env.COOKIE_DOMAIN ?? null,
    trustProxy: env.TRUST_PROXY,
  });
});
