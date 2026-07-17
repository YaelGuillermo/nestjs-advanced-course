// src/modules/accounts/auth/constants/auth-message.constants.ts
import type { MessageTemplate } from 'src/common/responses/response.types';

export const AUTH_SUCCESS = {
  LOGIN: {
    title: 'auth.success.login.title',
    description: 'auth.success.login.description',
  },
  REGISTER: {
    title: 'auth.success.register.title',
    description: 'auth.success.register.description',
  },
  LOGOUT: {
    title: 'auth.success.logout.title',
    description: 'auth.success.logout.description',
  },
  TOKEN_REFRESHED: {
    title: 'auth.success.token_refreshed.title',
    description: 'auth.success.token_refreshed.description',
  },
  PROFILE: {
    title: 'auth.success.profile.title',
    description: 'auth.success.profile.description',
  },
  GOOGLE_REDIRECT: {
    title: 'auth.success.google_redirect.title',
    description: 'auth.success.google_redirect.description',
  },
} as const satisfies Record<string, MessageTemplate>;

export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: {
    title: 'auth.errors.invalid_credentials.title',
    description: 'auth.errors.invalid_credentials.description',
  },
  INVALID_REFRESH_TOKEN: {
    title: 'auth.errors.invalid_refresh_token.title',
    description: 'auth.errors.invalid_refresh_token.description',
  },
  EMAIL_ALREADY_EXISTS: {
    title: 'auth.errors.email_already_exists.title',
    description: 'auth.errors.email_already_exists.description',
  },
  UNAUTHORIZED: {
    title: 'auth.errors.unauthorized.title',
    description: 'auth.errors.unauthorized.description',
  },
  ACCOUNT_LOCKED: {
    title: 'auth.errors.account_locked.title',
    description: 'auth.errors.account_locked.description',
  },
  GOOGLE_PROFILE_EMAIL_REQUIRED: {
    title: 'auth.errors.google_profile_email_required.title',
    description: 'auth.errors.google_profile_email_required.description',
  },
  GOOGLE_OAUTH_NOT_CONFIGURED: {
    title: 'auth.errors.google_oauth_not_configured.title',
    description: 'auth.errors.google_oauth_not_configured.description',
  },
} as const satisfies Record<string, MessageTemplate>;
