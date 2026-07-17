// src/modules/accounts/auth/services/token.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from 'src/config/config.service';
import { AUTH_ERRORS } from '../constants/auth-message.constants';
import { TokenBlacklistReason } from '../enums/token-blacklist-reason.enum';
import type { AuthJwtPayload } from '../interfaces/auth-jwt-payload.interface';
import type { AuthTokensPayload } from '../types/auth-tokens.type';
import type { VerifiedAuthJwtPayload } from '../types/verified-auth-jwt-payload.type';
import {
  getExpiresInSeconds,
  isVerifiedAuthJwtPayload,
  toSignableAuthJwtPayload,
} from '../utils/jwt-payload.util';
import { TokenBlacklistService } from './token-blacklist.service';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {}

  async generateAccessToken(payload: AuthJwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.auth.jwtAccessTokenSecret,
      expiresIn: this.configService.auth.jwtAccessTokenExpiresIn,
    });
  }

  async generateRefreshToken(payload: AuthJwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.auth.jwtRefreshTokenSecret,
      expiresIn: this.configService.auth.jwtRefreshTokenExpiresIn,
    });
  }

  async generateTokens(payload: AuthJwtPayload): Promise<AuthTokensPayload> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(payload),
      this.generateRefreshToken(payload),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: getExpiresInSeconds(this.jwtService.decode(accessToken)),
      tokenType: 'Bearer',
    };
  }

  async verifyRefreshToken(token: string): Promise<VerifiedAuthJwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<VerifiedAuthJwtPayload>(
        token,
        {
          secret: this.configService.auth.jwtRefreshTokenSecret,
        },
      );

      if (!isVerifiedAuthJwtPayload(payload)) {
        throw new UnauthorizedException(AUTH_ERRORS.INVALID_REFRESH_TOKEN);
      }

      return payload;
    } catch {
      throw new UnauthorizedException(AUTH_ERRORS.INVALID_REFRESH_TOKEN);
    }
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokensPayload> {
    if (await this.tokenBlacklistService.isTokenBlacklisted(refreshToken)) {
      throw new UnauthorizedException(AUTH_ERRORS.INVALID_REFRESH_TOKEN);
    }

    const verifiedPayload = await this.verifyRefreshToken(refreshToken);
    const payload = toSignableAuthJwtPayload(verifiedPayload);

    await this.tokenBlacklistService.addToBlacklist(
      refreshToken,
      payload.sub,
      TokenBlacklistReason.REFRESH,
    );

    return this.generateTokens(payload);
  }
}
