// test/factories/index.ts
import { TokenBlacklist } from 'src/modules/accounts/auth/entities/token-blacklist.entity';
import { UserAvatar } from 'src/modules/accounts/users/entities/user-avatar.entity';
import { User } from 'src/modules/accounts/users/entities/user.entity';
import type { DataSource } from 'typeorm';
import { TokenBlacklistFactory } from './accounts/auth/token-blacklist.factory';
import { UserAvatarFactory } from './accounts/users/user-avatar.factory';
import { UserFactory } from './accounts/users/user.factory';

export interface TestFactories {
  users: UserFactory;
  userAvatars: UserAvatarFactory;
  tokenBlacklist: TokenBlacklistFactory;
}

export function createTestFactories(dataSource: DataSource): TestFactories {
  const userFactory = new UserFactory(dataSource.getRepository(User));

  return {
    users: userFactory,
    userAvatars: new UserAvatarFactory(
      dataSource.getRepository(UserAvatar),
      userFactory,
    ),
    tokenBlacklist: new TokenBlacklistFactory(
      dataSource.getRepository(TokenBlacklist),
      userFactory,
    ),
  };
}
