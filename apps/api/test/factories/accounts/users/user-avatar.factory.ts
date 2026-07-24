// test/factories/accounts/users/user-avatar.factory.ts
import { faker } from '@faker-js/faker';
import type { UserAvatar } from 'src/modules/accounts/users/entities/user-avatar.entity';
import type { Repository } from 'typeorm';
import {
  RepositoryFactory,
  randomImageFields,
  truncate,
} from '../../core/repository.factory';
import type { UserFactory } from './user.factory';

export interface UserAvatarFactoryInput {
  userId?: string;
  sourceUrl?: string | null;
  path?: string;
  originalName?: string;
  mimeType?: string;
  sizeBytes?: string;
  extension?: string;
  width?: number | null;
  height?: number | null;
  checksumSha256?: string | null;
}

export class UserAvatarFactory extends RepositoryFactory<
  UserAvatar,
  UserAvatarFactoryInput
> {
  constructor(
    repository: Repository<UserAvatar>,
    private readonly userFactory: UserFactory,
  ) {
    super(repository);
  }

  protected async build(overrides: Partial<UserAvatarFactoryInput>) {
    const user = overrides.userId ? null : await this.userFactory.make();
    const image = randomImageFields(
      'uploads/users/avatars',
      'user-avatar',
      'png',
    );

    return {
      userId: overrides.userId ?? user?.id,
      sourceUrl:
        overrides.sourceUrl ??
        truncate(faker.internet.url({ appendSlash: false }), 1024),
      ...image,
      ...overrides,
    };
  }
}
