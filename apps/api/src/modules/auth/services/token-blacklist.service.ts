// src/modules/accounts/auth/services/token-blacklist.service.ts
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { AppLogger } from 'src/infrastructure/logging/services/app-logger.service';
import { LessThanOrEqual, MoreThan, type Repository } from 'typeorm';
import { TokenBlacklist } from '../entities/token-blacklist.entity';
import type { TokenBlacklistReason } from '../enums/token-blacklist-reason.enum';
import { getJwtExpirationDate } from '../utils/jwt-payload.util';
import { createTokenHash, createTokenPrefix } from '../utils/token-hash.util';

@Injectable()
export class TokenBlacklistService {
  constructor(
    @InjectRepository(TokenBlacklist)
    private readonly tokenBlacklistRepository: Repository<TokenBlacklist>,
    private readonly jwtService: JwtService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(TokenBlacklistService.name);
  }

  async addToBlacklist(
    token: string,
    userId: string,
    reason?: TokenBlacklistReason,
  ): Promise<void> {
    const expiresAt = getJwtExpirationDate(this.jwtService.decode(token));

    if (!expiresAt) {
      this.logger.warn({
        message:
          'Token could not be decoded for blacklist expiration handling.',
        userId,
        tokenPrefix: createTokenPrefix(token),
      });
      return;
    }

    const tokenHash = createTokenHash(token);

    await this.tokenBlacklistRepository.upsert(
      {
        tokenHash,
        tokenPrefix: createTokenPrefix(token),
        expiresAt,
        userId,
        reason: reason ?? null,
      },
      ['tokenHash'],
    );
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const tokenHash = createTokenHash(token);
    const existingToken = await this.tokenBlacklistRepository.findOne({
      where: {
        tokenHash,
        expiresAt: MoreThan(new Date()),
      },
      select: {
        id: true,
      },
    });

    return Boolean(existingToken);
  }

  async cleanupExpiredTokens(referenceDate = new Date()): Promise<number> {
    const result = await this.tokenBlacklistRepository.delete({
      expiresAt: LessThanOrEqual(referenceDate),
    });

    return result.affected ?? 0;
  }
}
