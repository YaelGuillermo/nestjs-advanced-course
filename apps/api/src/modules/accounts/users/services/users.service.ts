// src/modules/accounts/users/services/users.service.ts
import { Injectable } from '@nestjs/common';
import { DeleteMode } from 'src/common/enums/delete-mode.enum';
import type { CreateUserDto } from '../dto/request/create-user.dto';
import type { UpdatePasswordDto } from '../dto/request/update-password.dto';
import type { UpdateUserDto } from '../dto/request/update-user.dto';
import type { UserFilterDto } from '../dto/request/user-filter.dto';
import type { User } from '../entities/user.entity';
import { UsersCommandService } from './users-command.service';
import { UsersQueryService } from './users-query.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersQueryService: UsersQueryService,
    private readonly usersCommandService: UsersCommandService,
  ) {}

  findAll(filter: UserFilterDto) {
    return this.usersQueryService.findAll(filter);
  }

  findAllWithPagination(filter: UserFilterDto) {
    return this.usersQueryService.findAllWithPagination(filter);
  }

  findPagination(filter: UserFilterDto) {
    return this.usersQueryService.findPagination(filter);
  }

  findOne(id: string, withDeleted = false): Promise<User> {
    return this.usersQueryService.findOne(id, withDeleted);
  }

  findOneByEmail(email: string, withDeleted = false): Promise<User> {
    return this.usersQueryService.findOneByEmail(email, withDeleted);
  }

  findOneByUsername(username: string, withDeleted = false): Promise<User> {
    return this.usersQueryService.findOneByUsername(username, withDeleted);
  }

  create(dto: CreateUserDto): Promise<User> {
    return this.usersCommandService.create(dto);
  }

  update(id: string, dto: UpdateUserDto): Promise<User> {
    return this.usersCommandService.update(id, dto);
  }

  remove(id: string, mode: DeleteMode = DeleteMode.SOFT): Promise<User> {
    return this.usersCommandService.remove(id, mode);
  }

  updatePassword(id: string, dto: UpdatePasswordDto): Promise<void> {
    return this.usersCommandService.updatePassword(id, dto);
  }

  updateLastLogin(userId: string): Promise<void> {
    return this.usersCommandService.updateLastLogin(userId);
  }
}
