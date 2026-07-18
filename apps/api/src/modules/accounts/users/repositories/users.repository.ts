// src/modules/accounts/users/repositories/users.repository.ts
import { Injectable } from '@nestjs/common';
import {
  BaseRepository,
  type SortMap,
} from 'src/common/repositories/base.repository';
import {
  Brackets,
  DataSource,
  type DeleteResult,
  type SelectQueryBuilder,
  type UpdateResult,
} from 'typeorm';
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { User } from '../entities/user.entity';
import type { AuthProvider } from '../enums/auth-provider.enum';
import { UserSortBy } from '../enums/user-sort-by.enum';
import type { ResolvedUserFilter } from '../types/user-collection-result.type';
import type { LocalAuthUser, PasswordUser } from './users.repository.interface';

@Injectable()
export class UsersRepository extends BaseRepository<User> {
  constructor(private readonly dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  protected getSortMap(alias: string): SortMap {
    const column = (name: string): string => `${alias}.${name}`;

    return {
      [UserSortBy.CREATED_AT]: column('createdAt'),
      [UserSortBy.UPDATED_AT]: column('updatedAt'),
      [UserSortBy.USERNAME]: column('username'),
      [UserSortBy.FIRST_NAME]: column('firstName'),
      [UserSortBy.LAST_NAME]: column('lastName'),
      [UserSortBy.EMAIL]: column('email'),
      [UserSortBy.ROLE]: column('role'),
      [UserSortBy.PROVIDER]: column('provider'),
      [UserSortBy.IS_ACTIVE]: column('isActive'),
      [UserSortBy.LAST_LOGIN_AT]: column('lastLoginAt'),
    };
  }

  protected applySearch(
    qb: SelectQueryBuilder<User>,
    search: string,
    alias: string,
  ): SelectQueryBuilder<User> {
    const like = `%${search}%`;

    return qb.andWhere(
      new Brackets((where) => {
        where
          .where(`${alias}.username ILIKE :like`, { like })
          .orWhere(`${alias}.firstName ILIKE :like`, { like })
          .orWhere(`${alias}.lastName ILIKE :like`, { like })
          .orWhere(`${alias}.email ILIKE :like`, { like });
      }),
    );
  }

  private baseQueryBuilder(): SelectQueryBuilder<User> {
    return this.createQueryBuilder('user')
      .leftJoinAndSelect('user.avatar', 'avatar')
      .distinct(true);
  }

  private applyUserSpecificFilters(
    qb: SelectQueryBuilder<User>,
    filter: ResolvedUserFilter,
  ): SelectQueryBuilder<User> {
    if (filter.role) {
      qb.andWhere('user.role = :role', { role: filter.role });
    }

    if (filter.provider) {
      qb.andWhere('user.provider = :provider', { provider: filter.provider });
    }

    if (typeof filter.isActive === 'boolean') {
      qb.andWhere('user.isActive = :isActive', { isActive: filter.isActive });
    }

    if (typeof filter.isEmailVerified === 'boolean') {
      qb.andWhere('user.isEmailVerified = :isEmailVerified', {
        isEmailVerified: filter.isEmailVerified,
      });
    }

    return qb;
  }

  private buildListQueryBuilder(
    filter: ResolvedUserFilter,
  ): SelectQueryBuilder<User> {
    const qb = this.applyUserSpecificFilters(this.baseQueryBuilder(), filter);

    return this.applyFilters(qb, filter, 'user');
  }

  private async getOneWithDetailStats(
    qb: SelectQueryBuilder<User>,
  ): Promise<User | null> {
    const user = await qb.getOne();

    if (user) {
      user.programsCount = user.programsCount ?? null;
    }

    return user;
  }

  async findList(filter: ResolvedUserFilter): Promise<User[]> {
    return this.applyPagination(
      this.buildListQueryBuilder(filter),
      filter,
    ).getMany();
  }

  async countList(filter: ResolvedUserFilter): Promise<number> {
    return this.buildListQueryBuilder(filter)
      .select('user.id')
      .distinct(true)
      .getCount();
  }

  findByEmail(email: string): Promise<User | null> {
    return this.createQueryBuilder('user')
      .where('LOWER(user.email) = LOWER(:email)', { email })
      .withDeleted()
      .getOne();
  }

  findByEmailProvider(
    email: string,
    provider: AuthProvider,
  ): Promise<User | null> {
    return this.createQueryBuilder('user')
      .where('LOWER(user.email) = LOWER(:email)', { email })
      .andWhere('user.provider = :provider', { provider })
      .withDeleted()
      .getOne();
  }

  findByUsername(username: string): Promise<User | null> {
    return this.createQueryBuilder('user')
      .where('LOWER(user.username) = LOWER(:username)', { username })
      .withDeleted()
      .getOne();
  }

  findForLocalAuthByEmail(email: string): Promise<LocalAuthUser | null> {
    return this.createQueryBuilder('user')
      .select([
        'user.id',
        'user.email',
        'user.password',
        'user.provider',
        'user.isActive',
        'user.role',
      ])
      .where('LOWER(user.email) = LOWER(:email)', { email })
      .getOne();
  }

  findForLocalAuthByUsername(username: string): Promise<LocalAuthUser | null> {
    return this.createQueryBuilder('user')
      .select([
        'user.id',
        'user.email',
        'user.password',
        'user.provider',
        'user.isActive',
        'user.role',
      ])
      .where('LOWER(user.username) = LOWER(:username)', { username })
      .getOne();
  }

  private detailById(
    id: string,
    withDeleted: boolean,
  ): SelectQueryBuilder<User> {
    const qb = this.baseQueryBuilder().where('user.id = :id', { id });

    return withDeleted ? qb.withDeleted() : qb;
  }

  private detailByEmail(
    email: string,
    withDeleted: boolean,
  ): SelectQueryBuilder<User> {
    const qb = this.baseQueryBuilder().where(
      'LOWER(user.email) = LOWER(:email)',
      { email },
    );

    return withDeleted ? qb.withDeleted() : qb;
  }

  private detailByUsername(
    username: string,
    withDeleted: boolean,
  ): SelectQueryBuilder<User> {
    const qb = this.baseQueryBuilder().where(
      'LOWER(user.username) = LOWER(:username)',
      { username },
    );

    return withDeleted ? qb.withDeleted() : qb;
  }

  findDetailById(id: string, withDeleted = false): Promise<User | null> {
    return this.getOneWithDetailStats(this.detailById(id, withDeleted));
  }

  findDetailByEmail(email: string, withDeleted = false): Promise<User | null> {
    return this.getOneWithDetailStats(this.detailByEmail(email, withDeleted));
  }

  findDetailByUsername(
    username: string,
    withDeleted = false,
  ): Promise<User | null> {
    return this.getOneWithDetailStats(
      this.detailByUsername(username, withDeleted),
    );
  }

  updateById(
    id: string,
    payload: QueryDeepPartialEntity<User>,
  ): Promise<UpdateResult> {
    return super.update(id, payload);
  }

  softDeleteById(id: string): Promise<UpdateResult> {
    return super.softDelete(id);
  }

  hardDeleteById(id: string): Promise<DeleteResult> {
    return super.delete(id);
  }

  findPasswordById(id: string): Promise<PasswordUser | null> {
    return this.createQueryBuilder('user')
      .select(['user.id', 'user.password'])
      .where('user.id = :id', { id })
      .withDeleted()
      .getOne();
  }
}
