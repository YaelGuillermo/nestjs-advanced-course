// test/factories/accounts/users/user.factory.ts
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';
import type { User } from 'src/modules/accounts/users/entities/user.entity';
import { AuthProvider } from 'src/modules/accounts/users/enums/auth-provider.enum';
import { UserRole } from 'src/modules/accounts/users/enums/user-role.enum';
import type { Repository } from 'typeorm';
import {
  RepositoryFactory,
  randomBool,
  randomEmail,
  randomUsername,
  truncate,
} from '../../core/repository.factory';

export interface UserFactoryInput {
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  provider?: AuthProvider;
  role?: UserRole;
  isActive?: boolean;
  isEmailVerified?: boolean;
  lastLoginAt?: Date | null;
}

export class UserFactory extends RepositoryFactory<User, UserFactoryInput> {
  constructor(repository: Repository<User>) {
    super(repository);
  }

  protected async build(overrides: Partial<UserFactoryInput>) {
    const rawPassword = overrides.password ?? 'Strongp@ssword1!';

    return {
      username: overrides.username ?? randomUsername('user', 32),
      firstName: overrides.firstName ?? truncate(faker.person.firstName(), 64),
      lastName: overrides.lastName ?? truncate(faker.person.lastName(), 64),
      email: overrides.email ?? randomEmail('user'),
      password: await bcrypt.hash(rawPassword, 10),
      provider: overrides.provider ?? AuthProvider.LOCAL,
      role: overrides.role ?? UserRole.USER,
      isActive: overrides.isActive ?? randomBool(0.92),
      isEmailVerified: overrides.isEmailVerified ?? randomBool(0.8),
      lastLoginAt: overrides.lastLoginAt ?? null,
    };
  }
}
