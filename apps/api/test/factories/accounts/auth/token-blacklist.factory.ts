// test/factories/accounts/auth/token-blacklist.factory.ts
import { faker } from '@faker-js/faker';
import { JwtService } from '@nestjs/jwt';
import type { TokenBlacklist } from 'src/modules/accounts/auth/entities/token-blacklist.entity';
import { TokenBlacklistReason } from 'src/modules/accounts/auth/enums/token-blacklist-reason.enum';
import {
  createTokenHash,
  createTokenPrefix,
} from 'src/modules/accounts/auth/utils/token-hash.util';
import { UserRole } from 'src/modules/accounts/users/enums/user-role.enum';
import type { Repository } from 'typeorm';
import { RepositoryFactory } from '../../core/repository.factory';
import type { UserFactory } from '../users/user.factory';

export interface TokenBlacklistFactoryInput {
  token?: string;
  tokenHash?: string;
  tokenPrefix?: string;
  expiresAt?: Date;
  userId?: string;
  reason?: TokenBlacklistReason | null;
}

export class TokenBlacklistFactory extends RepositoryFactory<
  TokenBlacklist,
  TokenBlacklistFactoryInput
> {
  private readonly jwtService = new JwtService();

  constructor(
    repository: Repository<TokenBlacklist>,
    private readonly userFactory: UserFactory,
  ) {
    super(repository);
  }

  protected async build(overrides: Partial<TokenBlacklistFactoryInput>) {
    const user = overrides.userId ? null : await this.userFactory.make();
    const userId = overrides.userId ?? user?.id;
    const token =
      overrides.token ??
      this.jwtService.sign(
        {
          sub: userId,
          email:
            user?.email ??
            `blacklisted_${faker.string.alphanumeric(8)}@example.com`,
          role: user?.role ?? UserRole.USER,
        },
        {
          secret: 'test-access-secret-at-least-32-characters-long',
          expiresIn: '30m',
        },
      );

    return {
      tokenHash: overrides.tokenHash ?? createTokenHash(token),
      tokenPrefix: overrides.tokenPrefix ?? createTokenPrefix(token),
      expiresAt: overrides.expiresAt ?? faker.date.soon({ days: 30 }),
      userId,
      reason: overrides.reason ?? TokenBlacklistReason.LOGOUT,
    };
  }
}
