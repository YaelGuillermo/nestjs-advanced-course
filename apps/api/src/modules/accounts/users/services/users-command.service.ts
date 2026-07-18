// src/modules/accounts/users/services/users-command.service.ts
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DeleteMode } from 'src/common/enums/delete-mode.enum';
import { USER_ERRORS, USER_VALIDATION } from '../constants/user.constants';
import type { CreateUserDto } from '../dto/request/create-user.dto';
import type { UpdatePasswordDto } from '../dto/request/update-password.dto';
import type { UpdateUserDto } from '../dto/request/update-user.dto';
import type { User } from '../entities/user.entity';
import { AuthProvider } from '../enums/auth-provider.enum';
import { UserRole } from '../enums/user-role.enum';
import type { IUsersRepository } from '../repositories/users.repository.interface';
import {
  PASSWORD_HASHER,
  USERS_REPOSITORY,
} from '../repositories/users.tokens';
import { assertPasswordsMatch } from '../utils/user-password.util';
import type { IPasswordHasher } from './security/password-hasher.interface';
import { UsersQueryService } from './users-query.service';

@Injectable()
export class UsersCommandService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: IPasswordHasher,
    private readonly usersQueryService: UsersQueryService,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const payload = this.resolveCreatePayload(dto);

    await this.assertEmailIsAvailable(payload.email);
    await this.assertUsernameIsAvailable(payload.username);

    const created = await this.usersRepository.save(
      this.usersRepository.create({
        ...payload,
        password: payload.password
          ? await this.passwordHasher.hash(payload.password)
          : null,
      }),
    );

    return this.usersQueryService.findOne(created.id);
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    await this.assertUserExists(id);

    if (dto.email) {
      await this.assertEmailIsAvailable(dto.email, id);
    }

    if (dto.username) {
      await this.assertUsernameIsAvailable(dto.username, id);
    }

    const result = await this.usersRepository.updateById(id, dto);

    if (!result.affected) {
      throw new NotFoundException(USER_ERRORS.NOT_FOUND);
    }

    return this.usersQueryService.findOne(id);
  }

  async remove(id: string, mode: DeleteMode = DeleteMode.SOFT): Promise<User> {
    const before = await this.usersQueryService.findOne(id, true);

    if (mode === DeleteMode.HARD) {
      await this.usersRepository.hardDeleteById(id);
      return before;
    }

    const result = await this.usersRepository.softDeleteById(id);

    if (!result.affected) {
      throw new NotFoundException(USER_ERRORS.NOT_FOUND);
    }

    return (await this.usersRepository.findDetailById(id, true)) ?? before;
  }

  async updatePassword(id: string, dto: UpdatePasswordDto): Promise<void> {
    const user = await this.usersRepository.findPasswordById(id);

    if (!user) {
      throw new NotFoundException(USER_ERRORS.NOT_FOUND);
    }

    if (!user.password) {
      throw new BadRequestException(USER_ERRORS.PASSWORD_NOT_SET);
    }

    const isValidOldPassword = await this.passwordHasher.compare(
      dto.oldPassword,
      user.password,
    );

    if (!isValidOldPassword) {
      throw new BadRequestException(USER_ERRORS.OLD_PASSWORD_INCORRECT);
    }

    assertPasswordsMatch(dto.newPassword, dto.confirmPassword);

    await this.usersRepository.updateById(id, {
      password: await this.passwordHasher.hash(dto.newPassword),
    });
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.usersRepository.updateById(userId, {
      lastLoginAt: new Date(),
    });
  }

  private resolveCreatePayload(
    dto: CreateUserDto,
  ): Required<
    Pick<
      CreateUserDto,
      | 'username'
      | 'email'
      | 'firstName'
      | 'lastName'
      | 'role'
      | 'provider'
      | 'isActive'
      | 'isEmailVerified'
    >
  > &
    Pick<CreateUserDto, 'password'> {
    const provider = dto.provider ?? AuthProvider.LOCAL;
    const fallbackName = this.buildNameFallbackFromEmail(dto.email);

    return {
      username: dto.username,
      email: dto.email,
      firstName: this.resolvePersonName(dto.firstName, fallbackName),
      lastName: this.resolvePersonName(dto.lastName, fallbackName),
      password: dto.password,
      role: dto.role ?? UserRole.USER,
      provider,
      isActive: dto.isActive ?? true,
      isEmailVerified: dto.isEmailVerified ?? provider !== AuthProvider.LOCAL,
    };
  }

  private resolvePersonName(
    value: string | undefined,
    fallback: string,
  ): string {
    if (value && USER_VALIDATION.PERSON_NAME_REGEX.test(value)) {
      return value;
    }

    return fallback;
  }

  private buildNameFallbackFromEmail(email: string): string {
    const localPart = email.split('@')[0] || 'User';
    const fallback =
      localPart
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ '-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, USER_VALIDATION.NAME_MAX_LENGTH) || 'User';

    return fallback;
  }

  private async assertUserExists(id: string): Promise<void> {
    const user = await this.usersRepository.findDetailById(id, true);

    if (!user) {
      throw new NotFoundException(USER_ERRORS.NOT_FOUND);
    }
  }

  private async assertEmailIsAvailable(
    email: string,
    ignoredUserId?: string,
  ): Promise<void> {
    const existing = await this.usersRepository.findByEmail(email);

    if (existing && existing.id !== ignoredUserId) {
      throw new ConflictException(USER_ERRORS.EMAIL_ALREADY_EXISTS);
    }
  }

  private async assertUsernameIsAvailable(
    username: string,
    ignoredUserId?: string,
  ): Promise<void> {
    const existing = await this.usersRepository.findByUsername(username);

    if (existing && existing.id !== ignoredUserId) {
      throw new ConflictException(USER_ERRORS.USERNAME_ALREADY_EXISTS);
    }
  }
}
