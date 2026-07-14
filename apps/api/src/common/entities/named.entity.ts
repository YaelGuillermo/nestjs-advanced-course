// src/common/entities/named.entity.ts
import { Column } from 'typeorm';
import { NAMED_CONFIG } from '../constants/named.constants';
import { BaseEntity } from './base.entity';

export abstract class NamedEntity extends BaseEntity {
  @Column({ type: 'varchar', length: NAMED_CONFIG.NAME_MAX_LENGTH })
  name: string;

  @Column({
    type: 'varchar',
    length: NAMED_CONFIG.DESCRIPTION_MAX_LENGTH,
    nullable: true,
    default: null,
  })
  description: string | null;
}
