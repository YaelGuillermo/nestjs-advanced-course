// test/support/accounts/auth/auth.paths.ts
export const AUTH_PATHS = {
  register: '/api/v1/accounts/auth/register',
  login: '/api/v1/accounts/auth/login',
  refresh: '/api/v1/accounts/auth/refresh',
  logout: '/api/v1/accounts/auth/logout',
  profile: '/api/v1/accounts/auth/profile',
  googleLogin: '/api/v1/accounts/auth/google/login',
  googleCallback: '/api/v1/accounts/auth/google/callback',
} as const;
