// test/e2e/accounts/auth/auth.matchers.ts
import { UserRole } from 'src/modules/accounts/users/enums/user-role.enum';
import {
  expectSuccessResponse,
  expectUuidString,
  type ApiSuccessResponse,
  type ExpectBaseResponseOptions,
} from 'test/support/assertions/api-response.assertions';
import {
  expectJwtPayload,
  type ExpectedJwtPayload,
} from 'test/support/assertions/jwt.assertions';

export interface TokensDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface AuthProfileDto {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: UserRole | string;
  isMe?: boolean;
}

export interface ExpectAuthTokensResponseOptions extends ExpectBaseResponseOptions {
  expectedJwtPayload?: ExpectedJwtPayload;
}

export interface ExpectAuthProfileResponseOptions extends ExpectBaseResponseOptions {
  expected?: Partial<AuthProfileDto>;
}

export function expectTokensData(data: unknown): asserts data is TokensDto {
  expect(data).toEqual(expect.any(Object));

  const tokens = data as TokensDto;

  expect(typeof tokens.accessToken).toBe('string');
  expect(typeof tokens.refreshToken).toBe('string');
  expect(typeof tokens.expiresIn).toBe('number');
  expect(tokens.expiresIn).toBeGreaterThanOrEqual(0);
  expect(tokens.tokenType).toBe('Bearer');
}

export function expectAuthTokensResponse(
  body: unknown,
  options: ExpectAuthTokensResponseOptions,
): asserts body is ApiSuccessResponse<TokensDto> {
  expectSuccessResponse<TokensDto>(body, options);
  expectTokensData(body.data);

  if (options.expectedJwtPayload) {
    expectJwtPayload(body.data.accessToken, options.expectedJwtPayload);
  }
}

export function expectAuthProfileResponse(
  body: unknown,
  options: ExpectAuthProfileResponseOptions,
): asserts body is ApiSuccessResponse<AuthProfileDto> {
  expectSuccessResponse<AuthProfileDto>(body, options);

  expect(body.data).toEqual(expect.any(Object));
  expectUuidString(body.data.id);
  expect(typeof body.data.email).toBe('string');
  expect(typeof body.data.role).toBe('string');

  if (options.expected?.id !== undefined) {
    expect(body.data.id).toBe(options.expected.id);
  }

  if (options.expected?.email !== undefined) {
    expect(body.data.email).toBe(options.expected.email.toLowerCase());
  }

  if (options.expected?.role !== undefined) {
    expect(body.data.role).toBe(options.expected.role);
  }
}
