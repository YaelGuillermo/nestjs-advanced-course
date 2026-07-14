// src/common/entities/image.entity.ts
import { Column } from 'typeorm';
import { StoredFileEntity } from './stored-file.entity';

export abstract class ImageEntity extends StoredFileEntity {
  @Column({ type: 'int', nullable: true })
  width: number | null;

  @Column({ type: 'int', nullable: true })
  height: number | null;
}
