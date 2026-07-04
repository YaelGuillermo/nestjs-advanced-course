// src/config/loaders/integrations.config.ts
import { registerAs } from '@nestjs/config';
import { getValidatedEnv } from '../env/env.validation';
import type { IntegrationsConfig } from '../types/config.types';
import { freezeConfig, requiredEnvValue } from '../utils/loader.utils';

export default registerAs('integrations', (): IntegrationsConfig => {
  const env = getValidatedEnv();
  const googleOAuthEnabled =
    env.GOOGLE_OAUTH_CLIENT_ID !== undefined &&
    env.GOOGLE_OAUTH_CLIENT_SECRET !== undefined &&
    env.GOOGLE_OAUTH_CALLBACK_URL !== undefined;

  const stripeEnabled = env.STRIPE_SECRET_KEY !== undefined;

  return freezeConfig({
    googleOAuth: googleOAuthEnabled
      ? {
          enabled: true,
          clientId: requiredEnvValue(
            env.GOOGLE_OAUTH_CLIENT_ID,
            'GOOGLE_OAUTH_CLIENT_ID',
          ),
          clientSecret: requiredEnvValue(
            env.GOOGLE_OAUTH_CLIENT_SECRET,
            'GOOGLE_OAUTH_CLIENT_SECRET',
          ),
          callbackUrl: requiredEnvValue(
            env.GOOGLE_OAUTH_CALLBACK_URL,
            'GOOGLE_OAUTH_CALLBACK_URL',
          ),
          callbackRoute: env.GOOGLE_OAUTH_CALLBACK_ROUTE,
        }
      : {
          enabled: false,
          callbackRoute: env.GOOGLE_OAUTH_CALLBACK_ROUTE,
        },
    stripe: stripeEnabled
      ? {
          enabled: true,
          secretKey: requiredEnvValue(
            env.STRIPE_SECRET_KEY,
            'STRIPE_SECRET_KEY',
          ),
          webhookSecret: env.STRIPE_WEBHOOK_SECRET ?? null,
          currency: env.STRIPE_CURRENCY,
        }
      : {
          enabled: false,
          webhookSecret: null,
          currency: env.STRIPE_CURRENCY,
        },
  });
});
