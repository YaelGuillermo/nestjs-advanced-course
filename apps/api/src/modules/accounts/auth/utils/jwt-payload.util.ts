// src/modules/accounts/auth/utils/jwt-payload.util.ts
import { UnauthorizedException } from '@nestjs/common';
import { isRecord } from 'src/common/utils/object.util';
import { UserRole } from 'src/modules/accounts/users/enums/user-role.enum';
import { AUTH_ERRORS } from '../constants/auth-message.constants';
import type { AuthJwtPayload } from '../interfaces/auth-jwt-payload.interface';
import type { VerifiedAuthJwtPayload } from '../types/verified-auth-jwt-payload.type';

interface JwtWithExpiration {
  exp?: number;
}

function isUserRole(value: unknown): value is UserRole {
  return Object.values(UserRole).includes(value as UserRole);
}

export function isAuthJwtPayload(value: unknown): value is AuthJwtPayload {
  return (
    isRecord(value) &&
    typeof value.sub === 'string' &&
    typeof value.email === 'string' &&
    isUserRole(value.role)
  );
}

export function isVerifiedAuthJwtPayload(
  value: unknown,
): value is VerifiedAuthJwtPayload {
  return isAuthJwtPayload(value);
}

export function toSignableAuthJwtPayload(
  payload: VerifiedAuthJwtPayload,
): AuthJwtPayload {
  if (!isAuthJwtPayload(payload)) {
    throw new UnauthorizedException(AUTH_ERRORS.INVALID_REFRESH_TOKEN);
  }

  return {
    sub: payload.sub,
    email: payload.email,
    role: payload.role,
  };
}

export function getExpiresInSeconds(decodedToken: unknown): number {
  if (!isRecord(decodedToken) || typeof decodedToken.exp !== 'number') {
    return 0;
  }

  return Math.max(0, decodedToken.exp - Math.floor(Date.now() / 1000));
}

export function getJwtExpirationDate(decodedToken: unknown): Date | null {
  if (!isRecord(decodedToken)) {
    return null;
  }

  const payload = decodedToken as JwtWithExpiration;

  return typeof payload.exp === 'number' ? new Date(payload.exp * 1000) : null;
}
