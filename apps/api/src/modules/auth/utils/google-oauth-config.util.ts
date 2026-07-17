// src/modules/accounts/auth/utils/google-oauth-config.util.ts
import { InternalServerErrorException } from '@nestjs/common';
import type { IntegrationsConfig } from 'src/config/types/config.types';
import { AUTH_ERRORS } from '../constants/auth-message.constants';

export interface GoogleOAuthRuntimeConfig {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
}

export function assertGoogleOAuthConfigured(
  integrations: IntegrationsConfig,
): GoogleOAuthRuntimeConfig {
  const { googleOAuth } = integrations;

  if (!googleOAuth.enabled) {
    throw new InternalServerErrorException(
      AUTH_ERRORS.GOOGLE_OAUTH_NOT_CONFIGURED,
    );
  }

  return {
    clientId: googleOAuth.clientId,
    clientSecret: googleOAuth.clientSecret,
    callbackUrl: googleOAuth.callbackUrl,
  };
}
