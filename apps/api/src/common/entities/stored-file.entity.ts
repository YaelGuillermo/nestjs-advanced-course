// src/common/entities/stored-file.entity.ts
import { Column } from 'typeorm';
import { BaseEntity } from './base.entity';

export abstract class StoredFileEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 512 })
  path: string;

  @Column({ type: 'varchar', length: 256 })
  originalName: string;

  @Column({ type: 'varchar', length: 128 })
  mimeType: string;

  @Column({ type: 'bigint' })
  sizeBytes: string;

  @Column({ type: 'varchar', length: 16 })
  extension: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  checksumSha256: string | null;
}
