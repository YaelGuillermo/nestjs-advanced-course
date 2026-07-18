// src/modules/accounts/users/entities/user.entity.ts
import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, Index, OneToOne, type Relation } from 'typeorm';
import { AuthProvider } from '../enums/auth-provider.enum';
import { UserRole } from '../enums/user-role.enum';
import { UserAvatar } from './user-avatar.entity';

@Entity({ name: 'users', schema: 'accounts' })
@Index('uq_users_email', ['email'], { unique: true })
@Index('uq_users_username', ['username'], { unique: true })
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 32 })
  username: string;

  @Column({ type: 'varchar', length: 64 })
  firstName: string;

  @Column({ type: 'varchar', length: 64 })
  lastName: string;

  @Column({ type: 'varchar', length: 128 })
  email: string;

  @Column({ type: 'varchar', length: 256, nullable: true, select: false })
  password: string | null;

  @Column({
    type: 'enum',
    enum: UserRole,
    enumName: 'user_role_enum',
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: AuthProvider,
    enumName: 'auth_provider_enum',
    default: AuthProvider.LOCAL,
  })
  provider: AuthProvider;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isEmailVerified: boolean;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  lastLoginAt: Date | null;

  @OneToOne(() => UserAvatar, (avatar) => avatar.user, { nullable: true })
  avatar?: Relation<UserAvatar> | null;

  programsCount?: number | null;
}
