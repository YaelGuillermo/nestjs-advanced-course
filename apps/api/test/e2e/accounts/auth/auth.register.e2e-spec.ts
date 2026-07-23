// test/e2e/accounts/auth/auth.register.e2e-spec.ts
import type { INestApplication } from '@nestjs/common';
import { UserRole } from 'src/modules/accounts/users/enums/user-role.enum';
import {
  expectAccessTokenCanReadProfile,
  expectAuthFailure,
  expectAuthValidationFailure,
  expectErrorFields,
} from 'test/support/accounts/auth/auth.helpers';
import { AUTH_PATHS } from 'test/support/accounts/auth/auth.paths';
import {
  DEFAULT_TEST_PASSWORD,
  makeAuthCredentials,
  makeRegisterPayload,
} from 'test/support/accounts/auth/auth.payloads';
import {
  createE2EApp,
  destroyE2EApp,
  type E2EAppContext,
} from 'test/support/app/create-e2e-app';
import { requireResponseData } from 'test/support/assertions/api-response.assertions';
import { http } from 'test/support/http/http';
import { expectAuthTokensResponse, type TokensDto } from './auth.matchers';

describe('E2E accounts/auth register', () => {
  let app: INestApplication;
  let ctx: E2EAppContext;

  beforeAll(async () => {
    ctx = await createE2EApp();
    app = ctx.app;
  });

  afterAll(async () => {
    await destroyE2EApp(ctx);
  });

  it('POST /accounts/auth/register creates a user and returns valid tokens', async () => {
    const { register } = makeAuthCredentials();

    const response = await http(app).post<TokensDto>(
      AUTH_PATHS.register,
      register,
    );

    expectAuthTokensResponse(response.body, {
      statusCode: 201,
      path: AUTH_PATHS.register,
      expectedJwtPayload: {
        email: register.email,
        role: UserRole.USER,
      },
    });

    const tokens = requireResponseData(response.body);

    await expectAccessTokenCanReadProfile(app, tokens.accessToken, {
      email: register.email,
      role: UserRole.USER,
    });
  });

  it('POST /accounts/auth/register keeps the response envelope when lang=es is used', async () => {
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
      locale: 'es',
      expectedJwtPayload: {
        email: register.email,
        role: UserRole.USER,
      },
    });
  });

  it('POST /accounts/auth/register rejects duplicated email', async () => {
    const first = makeRegisterPayload();
    const duplicate = makeRegisterPayload({ email: first.email });

    const firstResponse = await http(app).post<TokensDto>(
      AUTH_PATHS.register,
      first,
    );

    expectAuthTokensResponse(firstResponse.body, {
      statusCode: 201,
      path: AUTH_PATHS.register,
      expectedJwtPayload: {
        email: first.email,
        role: UserRole.USER,
      },
    });

    const response = await http(app).post(AUTH_PATHS.register, duplicate);

    expectAuthFailure(response, [400, 409], AUTH_PATHS.register);
  });

  it('POST /accounts/auth/register rejects duplicated username', async () => {
    const first = makeRegisterPayload();
    const duplicate = makeRegisterPayload({ username: first.username });

    const firstResponse = await http(app).post<TokensDto>(
      AUTH_PATHS.register,
      first,
    );

    expectAuthTokensResponse(firstResponse.body, {
      statusCode: 201,
      path: AUTH_PATHS.register,
      expectedJwtPayload: {
        email: first.email,
        role: UserRole.USER,
      },
    });

    const response = await http(app).post(AUTH_PATHS.register, duplicate);

    expectAuthFailure(response, [400, 409], AUTH_PATHS.register);
  });

  it('POST /accounts/auth/register rejects an empty payload', async () => {
    const response = await http(app).post(AUTH_PATHS.register, {});

    expectAuthValidationFailure(response, AUTH_PATHS.register);
  });

  it('POST /accounts/auth/register rejects invalid email format', async () => {
    const response = await http(app).post(AUTH_PATHS.register, {
      ...makeRegisterPayload(),
      email: 'not-an-email',
    });

    expectAuthValidationFailure(response, AUTH_PATHS.register);
    expectErrorFields(response, ['email']);
  });

  it('POST /accounts/auth/register rejects missing email', async () => {
    const { email: _email, ...payloadWithoutEmail } = makeRegisterPayload();

    const response = await http(app).post(
      AUTH_PATHS.register,
      payloadWithoutEmail,
    );

    expectAuthValidationFailure(response, AUTH_PATHS.register);
    expectErrorFields(response, ['email']);
  });

  it('POST /accounts/auth/register rejects weak password', async () => {
    const response = await http(app).post(AUTH_PATHS.register, {
      ...makeRegisterPayload(),
      password: 'short',
    });

    expectAuthValidationFailure(response, AUTH_PATHS.register);
    expectErrorFields(response, ['password']);
  });

  it('POST /accounts/auth/register rejects non-whitelisted fields', async () => {
    const response = await http(app).post(AUTH_PATHS.register, {
      ...makeRegisterPayload({ password: DEFAULT_TEST_PASSWORD }),
      unknownField: 'should-not-pass',
    });

    expectAuthValidationFailure(response, AUTH_PATHS.register);
    expectErrorFields(response, ['unknownField']);
  });
});
