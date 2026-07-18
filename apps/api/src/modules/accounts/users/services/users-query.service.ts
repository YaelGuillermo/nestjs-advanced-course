// src/modules/accounts/users/services/users-query.service.ts
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PaginationService } from 'src/common/pagination/pagination.service';
import type { NormalizedPagination } from 'src/common/pagination/pagination.types';
import type { CollectionPaginationData } from 'src/common/responses/collection-response.util';
import { USER_ERRORS } from '../constants/user.constants';
import type { UserFilterDto } from '../dto/request/user-filter.dto';
import type { User } from '../entities/user.entity';
import type { IUsersRepository } from '../repositories/users.repository.interface';
import { USERS_REPOSITORY } from '../repositories/users.tokens';
import type {
  ResolvedUserFilter,
  UserCollectionResult,
} from '../types/user-collection-result.type';

@Injectable()
export class UsersQueryService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly paginationService: PaginationService,
  ) {}

  private normalizeFilter(filter: UserFilterDto): ResolvedUserFilter {
    const pagination: NormalizedPagination =
      this.paginationService.normalize(filter);

    return {
      ...filter,
      ...pagination,
    };
  }

  private buildCollectionPagination(
    result: UserCollectionResult,
  ): CollectionPaginationData {
    return {
      meta: this.paginationService.buildMeta(
        result.filter.page,
        result.filter.limit,
        result.totalItems,
        result.items.length,
      ),
    };
  }

  private async findCollection(
    filter: UserFilterDto,
  ): Promise<UserCollectionResult> {
    const resolvedFilter = this.normalizeFilter(filter);

    const [items, totalItems] = await Promise.all([
      this.usersRepository.findList(resolvedFilter),
      this.usersRepository.countList(resolvedFilter),
    ]);

    return {
      items,
      totalItems,
      filter: resolvedFilter,
    };
  }

  private async findDetailByIdOrFail(
    id: string,
    withDeleted = false,
  ): Promise<User> {
    const user = await this.usersRepository.findDetailById(id, withDeleted);

    if (!user) {
      throw new NotFoundException(USER_ERRORS.NOT_FOUND);
    }

    return user;
  }

  private async findDetailByEmailOrFail(
    email: string,
    withDeleted = false,
  ): Promise<User> {
    const user = await this.usersRepository.findDetailByEmail(
      email,
      withDeleted,
    );

    if (!user) {
      throw new NotFoundException(USER_ERRORS.NOT_FOUND);
    }

    return user;
  }

  private async findDetailByUsernameOrFail(
    username: string,
    withDeleted = false,
  ): Promise<User> {
    const user = await this.usersRepository.findDetailByUsername(
      username,
      withDeleted,
    );

    if (!user) {
      throw new NotFoundException(USER_ERRORS.NOT_FOUND);
    }

    return user;
  }

  findAll(filter: UserFilterDto): Promise<UserCollectionResult> {
    return this.findCollection(filter);
  }

  async findAllWithPagination(filter: UserFilterDto): Promise<{
    result: UserCollectionResult;
    pagination: CollectionPaginationData;
  }> {
    const result = await this.findAll(filter);
    const pagination = this.buildCollectionPagination(result);

    return { result, pagination };
  }

  async findPagination(
    filter: UserFilterDto,
  ): Promise<CollectionPaginationData> {
    const result = await this.findCollection(filter);
    return this.buildCollectionPagination(result);
  }

  findOne(id: string, withDeleted = false): Promise<User> {
    return this.findDetailByIdOrFail(id, withDeleted);
  }

  findOneByEmail(email: string, withDeleted = false): Promise<User> {
    return this.findDetailByEmailOrFail(email, withDeleted);
  }

  findOneByUsername(username: string, withDeleted = false): Promise<User> {
    return this.findDetailByUsernameOrFail(username, withDeleted);
  }
}
