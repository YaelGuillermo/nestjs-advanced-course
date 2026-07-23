// test/e2e/accounts/auth/auth.refresh.e2e-spec.ts
import type { INestApplication } from '@nestjs/common';
import { UserRole } from 'src/modules/accounts/users/enums/user-role.enum';
import {
  expectAccessTokenCanReadProfile,
  expectAuthFailure,
  expectAuthValidationFailure,
  makeWellFormedInvalidRefreshToken,
  refreshForAuth,
  registerAndAuthenticate,
} from 'test/support/accounts/auth/auth.helpers';
import { AUTH_PATHS } from 'test/support/accounts/auth/auth.paths';
import { makeRefreshTokenPayload } from 'test/support/accounts/auth/auth.payloads';
import {
  createE2EApp,
  destroyE2EApp,
  type E2EAppContext,
} from 'test/support/app/create-e2e-app';
import { http } from 'test/support/http/http';
import { expectAuthTokensResponse, type TokensDto } from './auth.matchers';

describe('E2E accounts/auth refresh', () => {
  let app: INestApplication;
  let ctx: E2EAppContext;

  beforeAll(async () => {
    ctx = await createE2EApp();
    app = ctx.app;
  });

  afterAll(async () => {
    await destroyE2EApp(ctx);
  });

  it('POST /accounts/auth/refresh returns a new valid access token', async () => {
    const session = await registerAndAuthenticate(app);

    const tokens = await refreshForAuth(
      app,
      session.refreshToken,
      session.register.email,
    );

    await expectAccessTokenCanReadProfile(app, tokens.accessToken, {
      email: session.register.email,
      role: UserRole.USER,
    });
  });

  it('POST /accounts/auth/refresh keeps response envelope when lang=es is used', async () => {
    const session = await registerAndAuthenticate(app);

    const response = await http(app).post<TokensDto>(
      AUTH_PATHS.refresh,
      makeRefreshTokenPayload(session.refreshToken),
      {
        query: { lang: 'es' },
      },
    );

    expectAuthTokensResponse(response.body, {
      statusCode: 200,
      path: `${AUTH_PATHS.refresh}?lang=es`,
      locale: 'es',
      expectedJwtPayload: {
        email: session.register.email,
        role: UserRole.USER,
      },
    });
  });

  it('POST /accounts/auth/refresh rejects an empty payload', async () => {
    const response = await http(app).post(AUTH_PATHS.refresh, {});

    expectAuthValidationFailure(response, AUTH_PATHS.refresh);
  });

  it('POST /accounts/auth/refresh rejects a malformed token', async () => {
    const response = await http(app).post(
      AUTH_PATHS.refresh,
      makeRefreshTokenPayload('invalid-refresh-token'),
    );

    expectAuthFailure(response, 400, AUTH_PATHS.refresh);
  });

  it('POST /accounts/auth/refresh rejects a well-formed token signed with the wrong secret', async () => {
    const response = await http(app).post(
      AUTH_PATHS.refresh,
      makeRefreshTokenPayload(makeWellFormedInvalidRefreshToken()),
    );

    expectAuthFailure(response, 401, AUTH_PATHS.refresh);
  });

  it('POST /accounts/auth/refresh rejects an access token used as refresh token', async () => {
    const session = await registerAndAuthenticate(app);

    const response = await http(app).post(
      AUTH_PATHS.refresh,
      makeRefreshTokenPayload(session.accessToken),
    );

    expectAuthFailure(response, [400, 401], AUTH_PATHS.refresh);
  });
});
