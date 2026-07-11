// src/infrastructure/storage/types/storage.types.ts
import type { StorageDriver } from 'src/config/env/env.types';
import type {
  MulterUploadFileLike,
  PersistedMulterFile,
} from './multer-file-like.type';

export type MediaVisibility = 'public' | 'private';

export interface PersistUploadOptions {
  folder: string;
  filename?: string;
  visibility?: MediaVisibility;
}

export interface PersistRemoteImageOptions {
  url: string;
  folder: string;
  originalName?: string;
  visibility?: MediaVisibility;
}

export interface StoredMediaDescriptor {
  driver: StorageDriver;
  key: string;
  relativePath: string;
  publicPath: string;
  publicUrl?: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  extension: string;
}

export type LocalStorageRuntimeDetails = {
  driver: 'local';
  localRootDir: string;
  publicPath: string;
  publicUrl: string | null;
};

export type S3StorageRuntimeDetails = {
  driver: 's3';
  bucketName: string;
  region: string;
  endpoint: string | null;
  forcePathStyle: boolean;
  publicPath: string;
  publicUrl: string | null;
};

export type StorageRuntimeDetails =
  | LocalStorageRuntimeDetails
  | S3StorageRuntimeDetails;

export interface MediaStorageDriverContract {
  readonly driver: StorageDriver;

  getRuntimeDetails(): StorageRuntimeDetails;

  assertHealthy(): Promise<void>;

  ensureTempFolder(): Promise<string>;

  persistUpload(
    file: MulterUploadFileLike,
    options: PersistUploadOptions,
  ): Promise<PersistedMulterFile>;

  duplicateRelativePath(
    relativePath: string,
    targetFolder?: string,
  ): Promise<string>;

  deleteMany(relativePaths: string[]): Promise<void>;

  toPublicPath(relativePath: string): string;

  toPublicUrl(relativePath: string): string | undefined;
}
