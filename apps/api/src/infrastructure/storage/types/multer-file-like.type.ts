// src/infrastructure/storage/types/multer-file-like.type.ts
import type { StorageDriver } from 'src/config/env/env.types';

export type MulterUploadFileLike = Pick<
  Express.Multer.File,
  'originalname' | 'mimetype' | 'size'
> &
  Partial<
    Pick<
      Express.Multer.File,
      'buffer' | 'destination' | 'encoding' | 'fieldname' | 'filename' | 'path'
    >
  >;

export type PersistedMulterFile = Pick<
  Express.Multer.File,
  'filename' | 'mimetype' | 'originalname' | 'size'
> & {
  /** Local absolute path when available. For S3 uploads this can be the source temp path. */
  path?: string;
  /** Original buffer when available. Useful for checksum/dimensions before remote persistence. */
  buffer?: Buffer;
  /** Object key / normalized relative path stored in DB. */
  relativePath: string;
  /** Public HTTP path, for example /media/programs/thumbnails/file.png. */
  publicPath: string;
  /** Absolute public URL when STORAGE_PUBLIC_URL exists. */
  publicUrl?: string;
  /** Storage driver that persisted the file. */
  storageDriver: StorageDriver;
  /** Same value as relativePath for local and object key for S3. */
  key: string;
};
