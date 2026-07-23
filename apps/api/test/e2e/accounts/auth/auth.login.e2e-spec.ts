// test/e2e/accounts/auth/auth.login.e2e-spec.ts
import type { INestApplication } from '@nestjs/common';
import { UserRole } from 'src/modules/accounts/users/enums/user-role.enum';
import {
  expectAccessTokenCanReadProfile,
  expectAuthFailure,
  expectAuthValidationFailure,
  loginForAuth,
  registerAndAuthenticate,
} from 'test/support/accounts/auth/auth.helpers';
import { AUTH_PATHS } from 'test/support/accounts/auth/auth.paths';
import { makeLoginPayload } from 'test/support/accounts/auth/auth.payloads';
import {
  createE2EApp,
  destroyE2EApp,
  type E2EAppContext,
} from 'test/support/app/create-e2e-app';
import { http } from 'test/support/http/http';
import { expectAuthTokensResponse, type TokensDto } from './auth.matchers';

describe('E2E accounts/auth login', () => {
  let app: INestApplication;
  let ctx: E2EAppContext;

  beforeAll(async () => {
    ctx = await createE2EApp();
    app = ctx.app;
  });

  afterAll(async () => {
    await destroyE2EApp(ctx);
  });

  it('POST /accounts/auth/login returns tokens for a registered email', async () => {
    const session = await registerAndAuthenticate(app);

    const tokens = await loginForAuth(app, session);

    await expectAccessTokenCanReadProfile(app, tokens.accessToken, {
      email: session.register.email,
      role: UserRole.USER,
    });
  });

  it('POST /accounts/auth/login supports the localized envelope when lang=es is used', async () => {
    const session = await registerAndAuthenticate(app);

    const response = await http(app).post<TokensDto>(
      AUTH_PATHS.login,
      session.login,
      {
        query: { lang: 'es' },
      },
    );

    expectAuthTokensResponse(response.body, {
      statusCode: 200,
      path: `${AUTH_PATHS.login}?lang=es`,
      locale: 'es',
      expectedJwtPayload: {
        email: session.register.email,
        role: UserRole.USER,
      },
    });
  });

  it('POST /accounts/auth/login can issue more than one valid access token', async () => {
    const session = await registerAndAuthenticate(app);

    const firstTokens = await loginForAuth(app, session);
    const secondTokens = await loginForAuth(app, session);

    await expectAccessTokenCanReadProfile(app, firstTokens.accessToken, {
      email: session.register.email,
    });
    await expectAccessTokenCanReadProfile(app, secondTokens.accessToken, {
      email: session.register.email,
    });
  });

  it('POST /accounts/auth/login with wrong password returns unauthorized', async () => {
    const session = await registerAndAuthenticate(app);

    const response = await http(app).post(AUTH_PATHS.login, {
      ...session.login,
      password: 'Wrongp@ssword1!',
    });

    expectAuthFailure(response, 401, AUTH_PATHS.login);
  });

  it('POST /accounts/auth/login with unknown identifier returns unauthorized', async () => {
    const response = await http(app).post(
      AUTH_PATHS.login,
      makeLoginPayload({ identifier: 'unknown-user@example.com' }),
    );

    expectAuthFailure(response, 401, AUTH_PATHS.login);
  });

  it('POST /accounts/auth/login without identifier does not authenticate', async () => {
    const session = await registerAndAuthenticate(app);
    const { identifier: _identifier, ...payloadWithoutIdentifier } =
      session.login;

    const response = await http(app).post(
      AUTH_PATHS.login,
      payloadWithoutIdentifier,
    );

    expectAuthFailure(response, [400, 401], AUTH_PATHS.login);
  });

  it('POST /accounts/auth/login without password does not authenticate', async () => {
    const session = await registerAndAuthenticate(app);
    const { password: _password, ...payloadWithoutPassword } = session.login;

    const response = await http(app).post(
      AUTH_PATHS.login,
      payloadWithoutPassword,
    );

    expectAuthFailure(response, [400, 401], AUTH_PATHS.login);
  });

  it('POST /accounts/auth/login rejects non-whitelisted fields after credentials pass guard', async () => {
    const session = await registerAndAuthenticate(app);

    const response = await http(app).post(AUTH_PATHS.login, {
      ...session.login,
      unknownField: 'should-not-pass',
    });

    expectAuthValidationFailure(response, AUTH_PATHS.login);
  });
});
