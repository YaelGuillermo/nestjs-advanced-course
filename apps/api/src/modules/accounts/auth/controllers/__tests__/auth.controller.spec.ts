// src/modules/accounts/auth/controllers/__tests__/auth.controller.spec.ts
import { HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import type { AuthenticatedUser } from 'src/common/interfaces/authenticated-user.interface';
import type { RequestWithUser } from 'src/common/interfaces/request-with-user.interface';
import { ConfigService } from 'src/config/config.service';
import type {
  AppConfig,
  IntegrationsConfig,
} from 'src/config/types/config.types';
import type { User } from 'src/modules/accounts/users/entities/user.entity';
import { AuthProvider } from 'src/modules/accounts/users/enums/auth-provider.enum';
import { UserRole } from 'src/modules/accounts/users/enums/user-role.enum';
import { UserPresenter } from 'src/modules/accounts/users/presentation/user.presenter';
import { UsersQueryService } from 'src/modules/accounts/users/services/users-query.service';
import type { LoginDto } from '../../dto/request/login.dto';
import type { RefreshTokenDto } from '../../dto/request/refresh-token.dto';
import type { RegisterDto } from '../../dto/request/register.dto';
import type { AuthTokensDto } from '../../dto/response/auth-tokens.dto';
import { AuthPresenter } from '../../presentation/auth.presenter';
import { AuthCommandService } from '../../services/auth-command.service';
import type { AuthTokensPayload } from '../../types/auth-tokens.type';
import { AuthController } from '../auth.controller';

type AuthCommandServiceMock = Pick<
  AuthCommandService,
  'login' | 'register' | 'refreshToken' | 'logout'
>;

type AuthPresenterMock = Pick<AuthPresenter, 'tokens'>;
type UsersQueryServiceMock = Pick<UsersQueryService, 'findOne'>;
type UserPresenterMock = Pick<UserPresenter, 'me'>;
type ConfigServiceMock = Pick<ConfigService, 'app' | 'integrations'>;

describe('AuthController', () => {
  let controller: AuthController;
  let configService: ConfigServiceMock;
  let authCommandService: jest.Mocked<AuthCommandServiceMock>;
  let authPresenter: jest.Mocked<AuthPresenterMock>;
  let usersQueryService: jest.Mocked<UsersQueryServiceMock>;
  let userPresenter: jest.Mocked<UserPresenterMock>;

  const user = {
    id: '1b99a9d9-756b-4c95-bf4f-b5ba334662c8',
    username: 'StrongTest',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    provider: AuthProvider.LOCAL,
    role: UserRole.USER,
    isActive: true,
    isEmailVerified: false,
    lastLoginAt: null,
    avatar: null,
  } as User;

  const authUser = {
    id: user.id,
    email: user.email,
    role: user.role,
  } as AuthenticatedUser<UserRole>;

  const tokensPayload: AuthTokensPayload = {
    accessToken: 'header.payload.signature',
    refreshToken: 'header.payload.signature.refresh',
    expiresIn: 1800,
    tokenType: 'Bearer',
  };

  const tokensDto = {
    accessToken: tokensPayload.accessToken,
    refreshToken: tokensPayload.refreshToken,
    expiresIn: tokensPayload.expiresIn,
    tokenType: tokensPayload.tokenType,
  } as AuthTokensDto;

  beforeEach(() => {
    configService = {
      app: {
        frontendPublicUrl: 'http://localhost:5173',
      } as AppConfig,
      integrations: {
        googleOAuth: {
          enabled: true,
          clientId: 'google-client-id',
          clientSecret: 'google-client-secret',
          callbackUrl:
            'http://localhost:3000/api/v1/accounts/auth/google/callback',
          callbackRoute: 'auth/google/callback',
        },
        stripe: {
          enabled: false,
          currency: 'usd',
          webhookSecret: null,
        },
      } as IntegrationsConfig,
    };

    authCommandService = {
      login: jest.fn(),
      register: jest.fn(),
      refreshToken: jest.fn(),
      logout: jest.fn(),
    };

    authPresenter = {
      tokens: jest.fn(),
    };

    usersQueryService = {
      findOne: jest.fn(),
    };

    userPresenter = {
      me: jest.fn(),
    };

    controller = new AuthController(
      configService as ConfigService,
      authCommandService as unknown as AuthCommandService,
      authPresenter as unknown as AuthPresenter,
      usersQueryService as unknown as UsersQueryService,
      userPresenter as unknown as UserPresenter,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('handleGoogleLogin returns undefined', () => {
    expect(controller.handleGoogleLogin()).toBeUndefined();
  });

  it('handleGoogleCallback logs in req.user and redirects to frontend callback route', async () => {
    authCommandService.login.mockResolvedValue(tokensPayload);

    const req = { user } as RequestWithUser<User>;
    const res = {
      redirect: jest.fn(),
    } as unknown as Response;

    await controller.handleGoogleCallback(req, res);

    const expectedUrl = new URL(
      configService.integrations.googleOAuth.callbackRoute,
      configService.app.frontendPublicUrl,
    );

    expectedUrl.hash = new URLSearchParams({
      accessToken: tokensPayload.accessToken,
      refreshToken: tokensPayload.refreshToken,
      expiresIn: String(tokensPayload.expiresIn),
      tokenType: tokensPayload.tokenType,
    }).toString();

    expect(authCommandService.login).toHaveBeenCalledTimes(1);
    expect(authCommandService.login).toHaveBeenCalledWith(user);
    expect(res.redirect).toHaveBeenCalledTimes(1);
    expect(res.redirect).toHaveBeenCalledWith(
      HttpStatus.FOUND,
      expectedUrl.toString(),
    );
  });

  it('login uses req.user and returns presenter tokens', async () => {
    authCommandService.login.mockResolvedValue(tokensPayload);
    authPresenter.tokens.mockReturnValue(tokensDto);

    const dto: LoginDto = {
      identifier: 'test@example.com',
      password: 'Strongp@ssword1!',
    };

    const req = { user } as RequestWithUser<User>;
    const result = await controller.login(dto, req);

    expect(authCommandService.login).toHaveBeenCalledWith(user);
    expect(authPresenter.tokens).toHaveBeenCalledWith(tokensPayload);
    expect(result).toEqual({ data: tokensDto });
  });

  it('register delegates to authCommandService.register and returns presenter tokens', async () => {
    authCommandService.register.mockResolvedValue(tokensPayload);
    authPresenter.tokens.mockReturnValue(tokensDto);

    const dto: RegisterDto = {
      username: 'StrongTest',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'Strongp@ssword1!',
    };

    const result = await controller.register(dto);

    expect(authCommandService.register).toHaveBeenCalledWith(dto);
    expect(authPresenter.tokens).toHaveBeenCalledWith(tokensPayload);
    expect(result).toEqual({ data: tokensDto });
  });

  it('refresh delegates only the refresh token and returns presenter tokens', async () => {
    authCommandService.refreshToken.mockResolvedValue(tokensPayload);
    authPresenter.tokens.mockReturnValue(tokensDto);

    const dto: RefreshTokenDto = {
      refreshToken: 'refresh-token-value',
    };

    const result = await controller.refresh(dto);

    expect(authCommandService.refreshToken).toHaveBeenCalledWith(
      dto.refreshToken,
    );
    expect(authPresenter.tokens).toHaveBeenCalledWith(tokensPayload);
    expect(result).toEqual({ data: tokensDto });
  });

  it('logout extracts bearer token and delegates logout', async () => {
    const result = await controller.logout(authUser, 'Bearer raw-access-token');

    expect(authCommandService.logout).toHaveBeenCalledWith(
      authUser.id,
      'raw-access-token',
    );
    expect(result).toEqual({ data: null });
  });

  it('getProfile loads actor user and returns presenter.me payload', async () => {
    const serialized = { id: user.id, email: user.email, isMe: true };

    usersQueryService.findOne.mockResolvedValue(user);
    userPresenter.me.mockReturnValue(serialized as never);

    const result = await controller.getProfile(authUser);

    expect(usersQueryService.findOne).toHaveBeenCalledWith(authUser.id);
    expect(userPresenter.me).toHaveBeenCalledWith(user, {
      actorId: authUser.id,
    });
    expect(result).toEqual({ data: serialized });
  });
});
