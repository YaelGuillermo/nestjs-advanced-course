// src/modules/accounts/users/entities/user-avatar.entity.ts
import { ImageEntity } from 'src/common/entities/image.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  type Relation,
} from 'typeorm';
import type { User } from './user.entity';

@Entity({ name: 'user_avatars', schema: 'accounts' })
@Index('uq_user_avatars_user_id', ['userId'], { unique: true })
export class UserAvatar extends ImageEntity {
  @Column({ type: 'uuid' })
  userId: string;

  @OneToOne('User', (user: User) => user.avatar, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: Relation<User>;

  @Column({ type: 'varchar', length: 1024, nullable: true, default: null })
  sourceUrl: string | null;
}
