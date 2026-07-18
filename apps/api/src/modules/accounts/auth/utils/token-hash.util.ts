// src/modules/accounts/auth/utils/token-hash.util.ts
import { createHash } from 'crypto';

export function createTokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function createTokenPrefix(token: string): string {
  return token.slice(0, 12);
}
