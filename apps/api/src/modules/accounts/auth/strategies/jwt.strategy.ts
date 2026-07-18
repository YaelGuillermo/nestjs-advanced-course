// src/modules/accounts/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from 'src/config/config.service';
import { AUTH_ERRORS } from '../constants/auth-message.constants';
import type { AuthJwtPayload } from '../interfaces/auth-jwt-payload.interface';
import { TokenBlacklistService } from '../services/token-blacklist.service';
import { extractBearerToken } from '../utils/bearer-token.util';
import { isAuthJwtPayload } from '../utils/jwt-payload.util';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.auth.jwtAccessTokenSecret,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: unknown): Promise<AuthJwtPayload> {
    if (!isAuthJwtPayload(payload)) {
      throw new UnauthorizedException(AUTH_ERRORS.UNAUTHORIZED);
    }

    const token = extractBearerToken(req.headers.authorization);

    if (token && (await this.tokenBlacklistService.isTokenBlacklisted(token))) {
      throw new UnauthorizedException(AUTH_ERRORS.UNAUTHORIZED);
    }

    return payload;
  }
}
