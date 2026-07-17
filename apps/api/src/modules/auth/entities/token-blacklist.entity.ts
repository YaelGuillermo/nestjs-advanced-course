// src/modules/accounts/auth/entities/token-blacklist.entity.ts
import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, Index } from 'typeorm';
import { TokenBlacklistReason } from '../enums/token-blacklist-reason.enum';

@Entity({ name: 'token_blacklist', schema: 'accounts' })
@Index('uq_token_blacklist_token_hash', ['tokenHash'], { unique: true })
@Index('idx_token_blacklist_expires_at', ['expiresAt'])
@Index('idx_token_blacklist_user_id', ['userId'])
export class TokenBlacklist extends BaseEntity {
  @Column({ type: 'char', length: 64 })
  tokenHash: string;

  @Column({ type: 'varchar', length: 16 })
  tokenPrefix: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({
    type: 'enum',
    enum: TokenBlacklistReason,
    enumName: 'token_blacklist_reason_enum',
    nullable: true,
    default: null,
  })
  reason: TokenBlacklistReason | null;
}
