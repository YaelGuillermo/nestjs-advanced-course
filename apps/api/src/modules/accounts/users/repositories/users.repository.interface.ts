// src/modules/accounts/users/repositories/users.repository.interface.ts
import type { DeleteResult, UpdateResult } from 'typeorm';
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import type { User } from '../entities/user.entity';
import type { AuthProvider } from '../enums/auth-provider.enum';
import type { ResolvedUserFilter } from '../types/user-collection-result.type';

export type LocalAuthUser = Pick<
  User,
  'id' | 'email' | 'password' | 'provider' | 'isActive' | 'role'
>;

export type PasswordUser = Pick<User, 'id' | 'password'>;

export interface IUsersRepository {
  findList(filter: ResolvedUserFilter): Promise<User[]>;
  countList(filter: ResolvedUserFilter): Promise<number>;

  findByEmail(email: string): Promise<User | null>;
  findByEmailProvider(
    email: string,
    provider: AuthProvider,
  ): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;

  findForLocalAuthByEmail(email: string): Promise<LocalAuthUser | null>;
  findForLocalAuthByUsername(username: string): Promise<LocalAuthUser | null>;

  findDetailById(id: string, withDeleted?: boolean): Promise<User | null>;
  findDetailByEmail(email: string, withDeleted?: boolean): Promise<User | null>;
  findDetailByUsername(
    username: string,
    withDeleted?: boolean,
  ): Promise<User | null>;

  create(payload: Partial<User>): User;
  save(user: User): Promise<User>;

  updateById(
    id: string,
    payload: QueryDeepPartialEntity<User>,
  ): Promise<UpdateResult>;
  softDeleteById(id: string): Promise<UpdateResult>;
  hardDeleteById(id: string): Promise<DeleteResult>;

  findPasswordById(id: string): Promise<PasswordUser | null>;
}
