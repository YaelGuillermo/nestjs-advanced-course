// test/e2e/accounts/auth/auth.e2e-spec.ts
import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from 'src/modules/accounts/users/enums/user-role.enum';
import { registerAndAuthenticate } from 'test/support/accounts/auth/auth.helpers';
import { AUTH_PATHS } from 'test/support/accounts/auth/auth.paths';
import {
  makeAuthCredentials,
  makeRefreshTokenPayload,
} from 'test/support/accounts/auth/auth.payloads';
import {
  createE2EApp,
  destroyE2EApp,
  type E2EAppContext,
} from 'test/support/app/create-e2e-app';
import {
  expectErrorResponse,
  requireResponseData,
} from 'test/support/assertions/api-response.assertions';
import { http } from 'test/support/http/http';
import {
  expectAuthProfileResponse,
  expectAuthTokensResponse,
  type AuthProfileDto,
  type TokensDto,
} from './auth.matchers';

function makeWellFormedInvalidRefreshToken(): string {
  const jwtService = new JwtService();

  return jwtService.sign(
    {
      sub: '00000000-0000-4000-8000-000000000000',
      email: 'invalid-refresh-token@example.com',
      role: UserRole.USER,
    },
    {
      secret: 'wrong-refresh-token-secret-at-least-32-characters-long',
      expiresIn: '1h',
    },
  );
}

describe('E2E accounts/auth', () => {
  let app: INestApplication;
  let ctx: E2EAppContext;

  beforeAll(async () => {
    ctx = await createE2EApp();
    app = ctx.app;
  });

  afterAll(async () => {
    await destroyE2EApp(ctx);
  });

  it('POST /accounts/auth/register returns auth tokens', async () => {
    const { register } = makeAuthCredentials();

    const response = await http(app).post<TokensDto>(
      AUTH_PATHS.register,
      register,
      {
        query: { lang: 'es' },
      },
    );

    expectAuthTokensResponse(response.body, {
      statusCode: 201,
      path: `${AUTH_PATHS.register}?lang=es`,
      expectedJwtPayload: {
        email: register.email,
        role: UserRole.USER,
      },
    });
  });

  it('POST /accounts/auth/login returns tokens for a registered user', async () => {
    const { register, login } = makeAuthCredentials();

    const registerResponse = await http(app).post<TokensDto>(
      AUTH_PATHS.register,
      register,
    );

    expectAuthTokensResponse(registerResponse.body, {
      statusCode: 201,
      path: AUTH_PATHS.register,
      expectedJwtPayload: {
        email: register.email,
        role: UserRole.USER,
      },
    });

    const response = await http(app).post<TokensDto>(AUTH_PATHS.login, login);

    expectAuthTokensResponse(response.body, {
      statusCode: 200,
      path: AUTH_PATHS.login,
      expectedJwtPayload: {
        email: register.email,
        role: UserRole.USER,
      },
    });
  });

  it('POST /accounts/auth/login with invalid password returns unauthorized', async () => {
    const { register, login } = makeAuthCredentials();

    const registerResponse = await http(app).post<TokensDto>(
      AUTH_PATHS.register,
      register,
    );

    expectAuthTokensResponse(registerResponse.body, {
      statusCode: 201,
      path: AUTH_PATHS.register,
      expectedJwtPayload: {
        email: register.email,
        role: UserRole.USER,
      },
    });

    const response = await http(app).post(
      AUTH_PATHS.login,
      {
        ...login,
        password: 'Wrongp@ssword1!',
      },
      { query: { lang: 'es' } },
    );

    expectErrorResponse(response.body, {
      statusCode: 401,
      path: `${AUTH_PATHS.login}?lang=es`,
    });
  });

  it('GET /accounts/auth/profile returns the authenticated user', async () => {
    const session = await registerAndAuthenticate(app);

    const response = await http(app).get<AuthProfileDto>(AUTH_PATHS.profile, {
      headers: http(app).bearer(session.accessToken),
    });

    expectAuthProfileResponse(response.body, {
      statusCode: 200,
      path: AUTH_PATHS.profile,
      expected: {
        email: session.register.email,
        role: UserRole.USER,
      },
    });
  });

  it('GET /accounts/auth/profile without token returns unauthorized', async () => {
    const response = await http(app).get(AUTH_PATHS.profile);

    expectErrorResponse(response.body, {
      statusCode: 401,
      path: AUTH_PATHS.profile,
    });
  });

  it('POST /accounts/auth/refresh returns valid auth tokens', async () => {
    const session = await registerAndAuthenticate(app);

    const refreshResponse = await http(app).post<TokensDto>(
      AUTH_PATHS.refresh,
      makeRefreshTokenPayload(session.refreshToken),
    );

    expectAuthTokensResponse(refreshResponse.body, {
      statusCode: 200,
      path: AUTH_PATHS.refresh,
      expectedJwtPayload: {
        email: session.register.email,
        role: UserRole.USER,
      },
    });

    const refreshed = requireResponseData(refreshResponse.body);

    expect(typeof refreshed.accessToken).toBe('string');
    expect(typeof refreshed.refreshToken).toBe('string');
    expect(refreshed.tokenType).toBe('Bearer');

    const profileResponse = await http(app).get<AuthProfileDto>(
      AUTH_PATHS.profile,
      {
        headers: http(app).bearer(refreshed.accessToken),
      },
    );

    expectAuthProfileResponse(profileResponse.body, {
      statusCode: 200,
      path: AUTH_PATHS.profile,
      expected: {
        email: session.register.email,
        role: UserRole.USER,
      },
    });
  });

  it('POST /accounts/auth/refresh with malformed refresh token returns bad request', async () => {
    const response = await http(app).post(
      AUTH_PATHS.refresh,
      makeRefreshTokenPayload('invalid-refresh-token'),
    );

    expectErrorResponse(response.body, {
      statusCode: 400,
      path: AUTH_PATHS.refresh,
    });
  });

  it('POST /accounts/auth/refresh with well-formed invalid refresh token returns unauthorized', async () => {
    const response = await http(app).post(
      AUTH_PATHS.refresh,
      makeRefreshTokenPayload(makeWellFormedInvalidRefreshToken()),
    );

    expectErrorResponse(response.body, {
      statusCode: 401,
      path: AUTH_PATHS.refresh,
    });
  });

  it('POST /accounts/auth/logout invalidates the current access token', async () => {
    const session = await registerAndAuthenticate(app);

    const logoutResponse = await http(app).post(
      AUTH_PATHS.logout,
      {},
      { headers: http(app).bearer(session.accessToken) },
    );

    expect(logoutResponse.status).toBe(200);

    const profileResponse = await http(app).get(AUTH_PATHS.profile, {
      headers: http(app).bearer(session.accessToken),
    });

    expectErrorResponse(profileResponse.body, {
      statusCode: 401,
      path: AUTH_PATHS.profile,
    });
  });
});
