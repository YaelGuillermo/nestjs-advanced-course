// test/e2e/accounts/auth/auth.session.e2e-spec.ts
import type { INestApplication } from '@nestjs/common';
import { UserRole } from 'src/modules/accounts/users/enums/user-role.enum';
import {
  expectAccessTokenCanReadProfile,
  expectAccessTokenCannotReadProfile,
  expectAuthFailure,
  makeWellFormedInvalidAccessToken,
  registerAndAuthenticate,
} from 'test/support/accounts/auth/auth.helpers';
import { AUTH_PATHS } from 'test/support/accounts/auth/auth.paths';
import {
  createE2EApp,
  destroyE2EApp,
  type E2EAppContext,
} from 'test/support/app/create-e2e-app';
import { expectSuccessResponse } from 'test/support/assertions/api-response.assertions';
import { http } from 'test/support/http/http';
import {
  expectAuthProfileResponse,
  type AuthProfileDto,
} from './auth.matchers';

describe('E2E accounts/auth profile and logout', () => {
  let app: INestApplication;
  let ctx: E2EAppContext;

  beforeAll(async () => {
    ctx = await createE2EApp();
    app = ctx.app;
  });

  afterAll(async () => {
    await destroyE2EApp(ctx);
  });

  it('GET /accounts/auth/profile returns current authenticated user', async () => {
    const session = await registerAndAuthenticate(app);

    const profile = await expectAccessTokenCanReadProfile(
      app,
      session.accessToken,
      {
        email: session.register.email,
        role: UserRole.USER,
      },
    );

    expect(profile.email).toBe(session.register.email.toLowerCase());
  });

  it('GET /accounts/auth/profile keeps response envelope when lang=es is used', async () => {
    const session = await registerAndAuthenticate(app);

    const response = await http(app).get<AuthProfileDto>(AUTH_PATHS.profile, {
      headers: http(app).bearer(session.accessToken),
      query: { lang: 'es' },
    });

    expectAuthProfileResponse(response.body, {
      statusCode: 200,
      path: `${AUTH_PATHS.profile}?lang=es`,
      locale: 'es',
      expected: {
        email: session.register.email,
        role: UserRole.USER,
      },
    });
  });

  it('GET /accounts/auth/profile without token returns unauthorized', async () => {
    const response = await http(app).get(AUTH_PATHS.profile);

    expectAuthFailure(response, 401, AUTH_PATHS.profile);
  });

  it('GET /accounts/auth/profile with malformed bearer token returns unauthorized', async () => {
    const response = await http(app).get(AUTH_PATHS.profile, {
      headers: http(app).bearer('malformed-token'),
    });

    expectAuthFailure(response, 401, AUTH_PATHS.profile);
  });

  it('GET /accounts/auth/profile with refresh token returns unauthorized', async () => {
    const session = await registerAndAuthenticate(app);

    const response = await http(app).get(AUTH_PATHS.profile, {
      headers: http(app).bearer(session.refreshToken),
    });

    expectAuthFailure(response, 401, AUTH_PATHS.profile);
  });

  it('GET /accounts/auth/profile with well-formed token signed with wrong secret returns unauthorized', async () => {
    const response = await http(app).get(AUTH_PATHS.profile, {
      headers: http(app).bearer(makeWellFormedInvalidAccessToken()),
    });

    expectAuthFailure(response, 401, AUTH_PATHS.profile);
  });

  it('POST /accounts/auth/logout returns null data for authenticated user', async () => {
    const session = await registerAndAuthenticate(app);

    const response = await http(app).post(
      AUTH_PATHS.logout,
      {},
      {
        headers: http(app).bearer(session.accessToken),
      },
    );

    expectSuccessResponse<null>(response.body, {
      statusCode: 200,
      path: AUTH_PATHS.logout,
    });
    expect(response.body.data).toBeNull();
  });

  it('POST /accounts/auth/logout without token returns unauthorized', async () => {
    const response = await http(app).post(AUTH_PATHS.logout, {});

    expectAuthFailure(response, 401, AUTH_PATHS.logout);
  });

  it('POST /accounts/auth/logout with malformed token returns unauthorized', async () => {
    const response = await http(app).post(
      AUTH_PATHS.logout,
      {},
      {
        headers: http(app).bearer('malformed-token'),
      },
    );

    expectAuthFailure(response, 401, AUTH_PATHS.logout);
  });

  it('POST /accounts/auth/logout invalidates the current access token', async () => {
    const session = await registerAndAuthenticate(app);

    const logoutResponse = await http(app).post(
      AUTH_PATHS.logout,
      {},
      {
        headers: http(app).bearer(session.accessToken),
      },
    );

    expectSuccessResponse<null>(logoutResponse.body, {
      statusCode: 200,
      path: AUTH_PATHS.logout,
    });

    await expectAccessTokenCannotReadProfile(app, session.accessToken);
  });

  it('POST /accounts/auth/logout rejects a token that was already blacklisted', async () => {
    const session = await registerAndAuthenticate(app);

    const firstLogout = await http(app).post(
      AUTH_PATHS.logout,
      {},
      {
        headers: http(app).bearer(session.accessToken),
      },
    );

    expectSuccessResponse<null>(firstLogout.body, {
      statusCode: 200,
      path: AUTH_PATHS.logout,
    });
    const secondLogout = await http(app).post(
      AUTH_PATHS.logout,
      {},
      {
        headers: http(app).bearer(session.accessToken),
      },
    );

    expectAuthFailure(secondLogout, 401, AUTH_PATHS.logout);
  });
});
