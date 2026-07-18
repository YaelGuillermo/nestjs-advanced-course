// src/modules/accounts/auth/services/auth-validation.service.ts
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { randomInt } from 'crypto';
import { USER_VALIDATION } from 'src/modules/accounts/users/constants/user.constants';
import type { User } from 'src/modules/accounts/users/entities/user.entity';
import { AuthProvider } from 'src/modules/accounts/users/enums/auth-provider.enum';
import type {
  IUsersRepository,
  LocalAuthUser,
} from 'src/modules/accounts/users/repositories/users.repository.interface';
import {
  PASSWORD_HASHER,
  USERS_REPOSITORY,
} from 'src/modules/accounts/users/repositories/users.tokens';
import type { IPasswordHasher } from 'src/modules/accounts/users/services/security/password-hasher.interface';
import { UserAvatarsService } from 'src/modules/accounts/users/services/user-avatars.service';
import { UsersCommandService } from 'src/modules/accounts/users/services/users-command.service';
import { UsersQueryService } from 'src/modules/accounts/users/services/users-query.service';
import { AUTH_ERRORS } from '../constants/auth-message.constants';
import type { LoginDto } from '../dto/request/login.dto';
import type { GoogleProfile } from '../interfaces/google-profile.interface';

const USERNAME_BASE_MAX_LENGTH = 24;

@Injectable()
export class AuthValidationService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: IPasswordHasher,
    private readonly usersQueryService: UsersQueryService,
    private readonly usersCommandService: UsersCommandService,
    private readonly userAvatarsService: UserAvatarsService,
  ) {}

  async validateLocalUser(dto: LoginDto): Promise<User> {
    const user = await this.findUserForLocalAuth(dto.identifier);

    if (!user) {
      throw new UnauthorizedException(AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    this.assertUserCanAuthenticate(user);

    if (user.provider !== AuthProvider.LOCAL || !user.password) {
      throw new UnauthorizedException(AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    const isValidPassword = await this.passwordHasher.compare(
      dto.password,
      user.password,
    );

    if (!isValidPassword) {
      throw new UnauthorizedException(AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    return this.usersQueryService.findOne(user.id);
  }

  async validateGoogleUser(profile: GoogleProfile): Promise<User> {
    const email = profile.email.toLowerCase();

    if (!email) {
      throw new UnauthorizedException(
        AUTH_ERRORS.GOOGLE_PROFILE_EMAIL_REQUIRED,
      );
    }

    const existingUser = await this.usersRepository.findByEmail(email);

    if (existingUser) {
      this.assertUserCanAuthenticate(existingUser);
      await this.trySetRemoteAvatar(existingUser.id, profile.pictureUrl);

      return this.usersQueryService.findOne(existingUser.id);
    }

    const createdUser = await this.usersCommandService.create({
      username: await this.generateUniqueUsername(email),
      email,
      firstName: this.getValidExternalPersonName(profile.firstName),
      lastName: this.getValidExternalPersonName(profile.lastName),
      provider: AuthProvider.GOOGLE,
      isEmailVerified: true,
    });

    await this.trySetRemoteAvatar(createdUser.id, profile.pictureUrl);

    return this.usersQueryService.findOne(createdUser.id);
  }

  private async findUserForLocalAuth(
    identifier: string,
  ): Promise<LocalAuthUser | null> {
    return identifier.includes('@')
      ? this.usersRepository.findForLocalAuthByEmail(identifier)
      : this.usersRepository.findForLocalAuthByUsername(identifier);
  }

  private assertUserCanAuthenticate(user: Pick<User, 'isActive'>): void {
    if (!user.isActive) {
      throw new UnauthorizedException(AUTH_ERRORS.ACCOUNT_LOCKED);
    }
  }

  private async trySetRemoteAvatar(
    userId: string,
    pictureUrl?: string,
  ): Promise<void> {
    if (!pictureUrl) {
      return;
    }

    await this.userAvatarsService.trySetRemoteAvatar(userId, pictureUrl);
  }

  private async generateUniqueUsername(email: string): Promise<string> {
    let candidate = this.buildUsernameCandidate(email);

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const existingUser = await this.usersRepository.findByUsername(candidate);

      if (!existingUser) {
        return candidate;
      }

      candidate = this.buildUsernameCandidate(email, attempt + 1);
    }

    return this.buildUsernameCandidate(email, Date.now());
  }

  private buildUsernameCandidate(email: string, suffixSeed?: number): string {
    const localPart = email.split('@')[0] || 'user';
    const base = this.buildUsernameBase(localPart);

    if (suffixSeed === undefined) {
      return base.slice(0, USER_VALIDATION.USERNAME_MAX_LENGTH);
    }

    const suffix =
      suffixSeed > 999 ? String(suffixSeed) : String(randomInt(1000, 10_000));

    return `${base}_${suffix}`.slice(0, USER_VALIDATION.USERNAME_MAX_LENGTH);
  }

  private buildUsernameBase(value: string): string {
    return (
      value
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, USERNAME_BASE_MAX_LENGTH) || 'user'
    );
  }

  private getValidExternalPersonName(value: string): string | undefined {
    return USER_VALIDATION.PERSON_NAME_REGEX.test(value) ? value : undefined;
  }
}
