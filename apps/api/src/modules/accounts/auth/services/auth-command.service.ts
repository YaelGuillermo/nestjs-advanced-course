// src/modules/accounts/auth/services/auth-command.service.ts
import { Injectable } from '@nestjs/common';
import type { User } from 'src/modules/accounts/users/entities/user.entity';
import { UsersCommandService } from 'src/modules/accounts/users/services/users-command.service';
import type { RegisterDto } from '../dto/request/register.dto';
import { TokenBlacklistReason } from '../enums/token-blacklist-reason.enum';
import type { AuthJwtPayload } from '../interfaces/auth-jwt-payload.interface';
import type { AuthTokensPayload } from '../types/auth-tokens.type';
import { TokenBlacklistService } from './token-blacklist.service';
import { TokenService } from './token.service';

@Injectable()
export class AuthCommandService {
  constructor(
    private readonly usersCommandService: UsersCommandService,
    private readonly tokenService: TokenService,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {}

  async login(user: User): Promise<AuthTokensPayload> {
    return this.tokenService.generateTokens(this.toJwtPayload(user));
  }

  async register(dto: RegisterDto): Promise<AuthTokensPayload> {
    const user = await this.usersCommandService.create(dto);

    return this.login(user);
  }

  async refreshToken(refreshToken: string): Promise<AuthTokensPayload> {
    return this.tokenService.refreshTokens(refreshToken);
  }

  async logout(userId: string, token?: string): Promise<void> {
    if (!token) {
      return;
    }

    await this.tokenBlacklistService.addToBlacklist(
      token,
      userId,
      TokenBlacklistReason.LOGOUT,
    );
  }

  private toJwtPayload(user: User): AuthJwtPayload {
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
