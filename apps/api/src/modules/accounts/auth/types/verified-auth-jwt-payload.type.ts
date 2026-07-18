// src/modules/accounts/auth/types/verified-auth-jwt-payload.type.ts
import type { AuthJwtPayload } from '../interfaces/auth-jwt-payload.interface';

export interface VerifiedAuthJwtPayload extends AuthJwtPayload {
  iat?: number;
  exp?: number;
  nbf?: number;
  aud?: string | string[];
  iss?: string;
  jti?: string;
}
