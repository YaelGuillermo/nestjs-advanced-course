// src/infrastructure/storage/services/media-storage.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { MEDIA_STORAGE_DRIVER } from '../constants/storage.constants';
import type {
  MulterUploadFileLike,
  PersistedMulterFile,
} from '../types/multer-file-like.type';
import type {
  MediaStorageDriverContract,
  PersistUploadOptions,
  StorageRuntimeDetails,
} from '../types/storage.types';
import {
  normalizeRelativeMediaPath,
  resolveMediaRootDir,
} from '../utils/media-paths.util';

@Injectable()
export class MediaStorageService {
  constructor(
    @Inject(MEDIA_STORAGE_DRIVER)
    private readonly storageDriver: MediaStorageDriverContract,
  ) {}

  get driver(): MediaStorageDriverContract['driver'] {
    return this.storageDriver.driver;
  }

  get publicPath(): string {
    return this.getRuntimeDetails().publicPath;
  }

  /**
   * Local-only compatibility getter.
   * Prefer getRuntimeDetails() and narrow by driver before reading local-only fields.
   */
  get localRootDir(): string {
    return this.getLocalRuntimeDetails().localRootDir;
  }

  getRuntimeDetails(): StorageRuntimeDetails {
    return this.storageDriver.getRuntimeDetails();
  }

  isLocal(): boolean {
    return this.driver === 'local';
  }

  isS3(): boolean {
    return this.driver === 's3';
  }

  toPublicPath(relativePath: string): string {
    return this.storageDriver.toPublicPath(relativePath);
  }

  toPublicUrl(relativePath: string): string | undefined {
    return this.storageDriver.toPublicUrl(relativePath);
  }

  async ensureTempFolder(): Promise<string> {
    return this.storageDriver.ensureTempFolder();
  }

  async assertHealthy(): Promise<void> {
    await this.storageDriver.assertHealthy();
  }

  async persistUpload(
    file: MulterUploadFileLike,
    options: PersistUploadOptions,
  ): Promise<PersistedMulterFile> {
    return this.storageDriver.persistUpload(file, options);
  }

  async duplicateRelativePath(
    relativePath: string,
    targetFolder?: string,
  ): Promise<string> {
    return this.storageDriver.duplicateRelativePath(relativePath, targetFolder);
  }

  async deleteMany(relativePaths: string[]): Promise<void> {
    await this.storageDriver.deleteMany(relativePaths);
  }

  async deleteTemporaryFile(filePath?: string): Promise<void> {
    if (!filePath) return;

    try {
      await unlink(filePath);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException)?.code;

      if (code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Local-only compatibility method.
   * It intentionally fails for S3 instead of silently inventing a local path.
   */
  resolveFolderPath(folder = ''): string {
    const details = this.getLocalRuntimeDetails();
    const safeFolder = normalizeRelativeMediaPath(folder);

    return safeFolder
      ? join(details.localRootDir, safeFolder)
      : details.localRootDir;
  }

  /**
   * Local-only compatibility method.
   * It intentionally fails for S3 instead of pretending S3 has an absolute path.
   */
  resolveAbsolutePath(relativePath: string): string {
    return join(
      this.getLocalRuntimeDetails().localRootDir,
      normalizeRelativeMediaPath(relativePath),
    );
  }

  /**
   * Local-only compatibility method.
   * Use ensureTempFolder() for driver-agnostic temporary work.
   */
  async ensureFolder(folder = ''): Promise<string> {
    const folderPath = this.resolveFolderPath(folder);
    await mkdir(folderPath, { recursive: true });
    return folderPath;
  }

  private getLocalRuntimeDetails(): Extract<
    StorageRuntimeDetails,
    { driver: 'local' }
  > {
    const details = this.getRuntimeDetails();

    if (details.driver !== 'local') {
      throw new Error(
        'Local storage path requested while STORAGE_DRIVER is not local. Use driver-agnostic storage methods instead.',
      );
    }

    return {
      ...details,
      localRootDir: resolveMediaRootDir(details.localRootDir),
    };
  }
}
