// test/support/accounts/auth/auth.payloads.ts
import { randomUUID } from 'crypto';
import type { LoginDto } from 'src/modules/accounts/auth/dto/request/login.dto';
import type { RefreshTokenDto } from 'src/modules/accounts/auth/dto/request/refresh-token.dto';
import type { RegisterDto } from 'src/modules/accounts/auth/dto/request/register.dto';

export const DEFAULT_TEST_PASSWORD = 'Strongp@ssword1!';

export interface AuthCredentialsBundle {
  register: RegisterDto;
  login: LoginDto;
}

function makeSuffix(): string {
  return randomUUID().replace(/-/g, '').slice(0, 10);
}

export function makeAuthCredentials(
  overrides: {
    register?: Partial<RegisterDto>;
    login?: Partial<LoginDto>;
  } = {},
): AuthCredentialsBundle {
  const suffix = makeSuffix();

  const register: RegisterDto = {
    username: `strong_test_${suffix}`,
    firstName: 'Test',
    lastName: 'User',
    email: `test_${suffix}@example.com`,
    password: DEFAULT_TEST_PASSWORD,
    ...overrides.register,
  };

  const login: LoginDto = {
    identifier: register.email,
    password: register.password,
    ...overrides.login,
  };

  return { register, login };
}

export function makeRegisterPayload(
  overrides: Partial<RegisterDto> = {},
): RegisterDto {
  return makeAuthCredentials({ register: overrides }).register;
}

export function makeLoginPayload(
  overrides: Partial<LoginDto> = {},
  source?: Pick<RegisterDto, 'email' | 'password'>,
): LoginDto {
  return {
    identifier: source?.email ?? `login_${makeSuffix()}@example.com`,
    password: source?.password ?? DEFAULT_TEST_PASSWORD,
    ...overrides,
  };
}

export function makeRefreshTokenPayload(
  refreshToken: string,
  overrides: Partial<RefreshTokenDto> = {},
): RefreshTokenDto {
  return {
    refreshToken,
    ...overrides,
  };
}
