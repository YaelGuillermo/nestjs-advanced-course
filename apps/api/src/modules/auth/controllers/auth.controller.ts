// src/modules/accounts/auth/controllers/auth.controller.ts
import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { SkipResponseInterceptor } from 'src/common/decorators/skip-response-interceptor.decorator';
import type { AuthenticatedUser } from 'src/common/interfaces/authenticated-user.interface';
import type { RequestWithUser } from 'src/common/interfaces/request-with-user.interface';
import { ConfigService } from 'src/config/config.service';
import type { User } from 'src/modules/accounts/users/entities/user.entity';
import { UserPresenter } from 'src/modules/accounts/users/presentation/user.presenter';
import { UsersQueryService } from 'src/modules/accounts/users/services/users-query.service';
import { AUTH_SUCCESS } from '../constants/auth-message.constants';
import { LoginDto } from '../dto/request/login.dto';
import { RefreshTokenDto } from '../dto/request/refresh-token.dto';
import { RegisterDto } from '../dto/request/register.dto';
import { GoogleAuthGuard } from '../guards/google-auth.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { AuthPresenter } from '../presentation/auth.presenter';
import { AuthCommandService } from '../services/auth-command.service';
import { extractBearerToken } from '../utils/bearer-token.util';
import { buildGoogleOAuthRedirectUrl } from '../utils/oauth-redirect.util';

@Controller('accounts/auth')
export class AuthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly authCommandService: AuthCommandService,
    private readonly authPresenter: AuthPresenter,
    private readonly usersQueryService: UsersQueryService,
    private readonly userPresenter: UserPresenter,
  ) {}

  @Get('google/login')
  @UseGuards(GoogleAuthGuard)
  handleGoogleLogin(): void {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @SkipResponseInterceptor()
  async handleGoogleCallback(
    @Req() request: RequestWithUser<User>,
    @Res() response: Response,
  ): Promise<void> {
    const tokens = await this.authCommandService.login(request.user);
    const redirectUrl = buildGoogleOAuthRedirectUrl({
      app: this.configService.app,
      integrations: this.configService.integrations,
      tokens,
    });

    response.redirect(HttpStatus.FOUND, redirectUrl);
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(AUTH_SUCCESS.LOGIN)
  async login(@Body() _dto: LoginDto, @Req() request: RequestWithUser<User>) {
    const tokens = await this.authCommandService.login(request.user);

    return {
      data: this.authPresenter.tokens(tokens),
    };
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage(AUTH_SUCCESS.REGISTER)
  async register(@Body() dto: RegisterDto) {
    const tokens = await this.authCommandService.register(dto);

    return {
      data: this.authPresenter.tokens(tokens),
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(AUTH_SUCCESS.TOKEN_REFRESHED)
  async refresh(@Body() dto: RefreshTokenDto) {
    const tokens = await this.authCommandService.refreshToken(dto.refreshToken);

    return {
      data: this.authPresenter.tokens(tokens),
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(AUTH_SUCCESS.LOGOUT)
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('authorization') authorization?: string,
  ) {
    await this.authCommandService.logout(
      user.id,
      extractBearerToken(authorization),
    );

    return {
      data: null,
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ResponseMessage(AUTH_SUCCESS.PROFILE)
  async getProfile(@CurrentUser() actor: AuthenticatedUser) {
    const user = await this.usersQueryService.findOne(actor.id);
    const data = this.userPresenter.me(user, {
      actorId: actor.id,
    });

    return { data };
  }
}
