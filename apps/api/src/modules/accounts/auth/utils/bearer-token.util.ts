// src/modules/accounts/auth/utils/bearer-token.util.ts
export function extractBearerToken(
  authorization?: string | string[],
): string | undefined {
  if (Array.isArray(authorization)) {
    return extractBearerToken(authorization[0]);
  }

  if (!authorization) {
    return undefined;
  }

  const [scheme, token] = authorization.trim().split(/\s+/, 2);

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return undefined;
  }

  return token;
}
