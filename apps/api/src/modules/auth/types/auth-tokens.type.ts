// src/modules/accounts/auth/types/auth-tokens.type.ts
export interface AuthTokensPayload {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}
