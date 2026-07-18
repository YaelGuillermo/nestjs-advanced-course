// src/modules/accounts/auth/utils/oauth-redirect.util.ts
import type {
  AppConfig,
  IntegrationsConfig,
} from 'src/config/types/config.types';
import type { AuthTokensPayload } from '../types/auth-tokens.type';

export function buildGoogleOAuthRedirectUrl(params: {
  app: AppConfig;
  integrations: IntegrationsConfig;
  tokens: AuthTokensPayload;
}): string {
  const redirectUrl = new URL(
    params.integrations.googleOAuth.callbackRoute,
    params.app.frontendPublicUrl,
  );

  redirectUrl.hash = new URLSearchParams({
    accessToken: params.tokens.accessToken,
    refreshToken: params.tokens.refreshToken,
    expiresIn: String(params.tokens.expiresIn),
    tokenType: params.tokens.tokenType,
  }).toString();

  return redirectUrl.toString();
}
