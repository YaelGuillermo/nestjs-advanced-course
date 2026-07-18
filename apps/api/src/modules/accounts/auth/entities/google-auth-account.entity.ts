// src/modules/accounts/auth/entities/google-auth-account.entity.ts
import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'google_auth_accounts', schema: 'accounts' })
@Index('uq_google_auth_accounts_google_id', ['googleId'], { unique: true })
@Index('idx_google_auth_accounts_user_id', ['userId'])
@Index('idx_google_auth_accounts_email', ['email'])
export class GoogleAuthAccount extends BaseEntity {
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 128 })
  googleId: string;

  @Column({ type: 'varchar', length: 160 })
  email: string;

  @Column({ type: 'varchar', length: 160, nullable: true, default: null })
  displayName: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true, default: null })
  pictureUrl: string | null;
}
