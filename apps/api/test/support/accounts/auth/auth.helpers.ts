// test/support/accounts/auth/auth.helpers.ts
import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from 'src/modules/accounts/users/enums/user-role.enum';
import {
  expectAuthProfileResponse,
  expectAuthTokensResponse,
  type AuthProfileDto,
  type TokensDto,
} from 'test/e2e/accounts/auth/auth.matchers';
import {
  expectErrorResponse,
  requireResponseData,
  type ApiErrorResponse,
} from 'test/support/assertions/api-response.assertions';
import {
  http,
  type RequestOptions,
  type TypedResponse,
} from 'test/support/http/http';
import { AUTH_PATHS } from './auth.paths';
import {
  makeAuthCredentials,
  makeRefreshTokenPayload,
  type AuthCredentialsBundle,
} from './auth.payloads';

export interface AuthE2ESession extends AuthCredentialsBundle {
  accessToken: string;
  refreshToken: string;
}

export interface AuthRequestExpectationOptions {
  request?: RequestOptions;
  expectedPath?: string;
}

export async function registerAndAuthenticate(
  app: INestApplication,
  options: AuthRequestExpectationOptions = {},
): Promise<AuthE2ESession> {
  const credentials = makeAuthCredentials();

  const response = await http(app).post<TokensDto>(
    AUTH_PATHS.register,
    credentials.register,
    options.request,
  );

  expectAuthTokensResponse(response.body, {
    statusCode: 201,
    path: options.expectedPath ?? AUTH_PATHS.register,
    expectedJwtPayload: {
      email: credentials.register.email,
      role: UserRole.USER,
    },
  });

  const tokens = requireResponseData(response.body);

  return {
    ...credentials,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

export async function loginForAuth(
  app: INestApplication,
  session: Pick<AuthE2ESession, 'login' | 'register'>,
  options: AuthRequestExpectationOptions = {},
): Promise<TokensDto> {
  const response = await http(app).post<TokensDto>(
    AUTH_PATHS.login,
    session.login,
    options.request,
  );

  expectAuthTokensResponse(response.body, {
    statusCode: 200,
    path: options.expectedPath ?? AUTH_PATHS.login,
    expectedJwtPayload: {
      email: session.register.email,
      role: UserRole.USER,
    },
  });

  return requireResponseData(response.body);
}

export async function refreshForAuth(
  app: INestApplication,
  refreshToken: string,
  expectedEmail: string,
  options: AuthRequestExpectationOptions = {},
): Promise<TokensDto> {
  const response = await http(app).post<TokensDto>(
    AUTH_PATHS.refresh,
    makeRefreshTokenPayload(refreshToken),
    options.request,
  );

  expectAuthTokensResponse(response.body, {
    statusCode: 200,
    path: options.expectedPath ?? AUTH_PATHS.refresh,
    expectedJwtPayload: {
      email: expectedEmail,
      role: UserRole.USER,
    },
  });

  return requireResponseData(response.body);
}

export async function expectAccessTokenCanReadProfile(
  app: INestApplication,
  accessToken: string,
  expected: Partial<AuthProfileDto> = {},
): Promise<AuthProfileDto> {
  const response = await http(app).get<AuthProfileDto>(AUTH_PATHS.profile, {
    headers: http(app).bearer(accessToken),
  });

  expectAuthProfileResponse(response.body, {
    statusCode: 200,
    path: AUTH_PATHS.profile,
    expected,
  });

  return requireResponseData(response.body);
}

export async function expectAccessTokenCannotReadProfile(
  app: INestApplication,
  accessToken: string,
): Promise<void> {
  const response = await http(app).get(AUTH_PATHS.profile, {
    headers: http(app).bearer(accessToken),
  });

  expectAuthFailure(response, 401, AUTH_PATHS.profile);
}

export function expectAuthFailure(
  response: TypedResponse,
  statusCode: number | readonly number[],
  path: string,
): asserts response is TypedResponse<null> {
  const allowedStatusCodes =
    typeof statusCode === 'number' ? [statusCode] : [...statusCode];

  expect(allowedStatusCodes).toContain(response.status);

  expectErrorResponse(response.body, {
    statusCode: response.status,
    path,
  });
}

export function expectAuthValidationFailure(
  response: TypedResponse,
  path: string,
): asserts response is TypedResponse<null> {
  expectAuthFailure(response, 400, path);

  const body = response.body as ApiErrorResponse;
  expect(body.errors).toEqual(expect.any(Object));
}

export function expectErrorFields(
  response: TypedResponse,
  fields: string[],
): void {
  const body = response.body as ApiErrorResponse;

  expect(body.errors).toEqual(expect.any(Object));

  for (const field of fields) {
    expect(body.errors).toHaveProperty(field);
  }
}

export function makeWellFormedInvalidAccessToken(): string {
  return makeTokenWithWrongSecret(
    'wrong-access-token-secret-at-least-32-chars',
  );
}

export function makeWellFormedInvalidRefreshToken(): string {
  return makeTokenWithWrongSecret(
    'wrong-refresh-token-secret-at-least-32-chars',
  );
}

function makeTokenWithWrongSecret(secret: string): string {
  const jwtService = new JwtService();

  return jwtService.sign(
    {
      sub: '00000000-0000-4000-8000-000000000000',
      email: 'invalid-auth-token@example.com',
      role: UserRole.USER,
    },
    {
      secret,
      expiresIn: '1h',
    },
  );
}
