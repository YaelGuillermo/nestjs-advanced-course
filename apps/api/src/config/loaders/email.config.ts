// src/config/loaders/email.config.ts
import { registerAs } from '@nestjs/config';
import { getValidatedEnv } from '../env/env.validation';
import type { EmailConfig } from '../types/config.types';
import { freezeConfig } from '../utils/loader.utils';

export default registerAs('email', (): EmailConfig => {
  const env = getValidatedEnv();

  return freezeConfig({
    enabled: env.SMTP_HOST !== undefined,
    host: env.SMTP_HOST ?? null,
    port: env.SMTP_PORT,
    username: env.SMTP_USERNAME ?? null,
    password: env.SMTP_PASSWORD ?? null,
    fromEmail: env.SMTP_FROM_EMAIL,
    fromName: env.SMTP_FROM_NAME,
    secure: env.SMTP_SECURE,
  });
});
