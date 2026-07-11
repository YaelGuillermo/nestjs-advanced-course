// src/infrastructure/storage/drivers/local-media-storage.driver.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { copyFile, mkdir, stat, unlink, writeFile } from 'fs/promises';
import { extname, join, posix } from 'path';
import { ConfigService } from 'src/config/config.service';
import type {
  LocalStorageConfig,
  StorageConfig,
} from 'src/config/types/config.types';
import {
  STORAGE_HEALTHCHECK_FOLDER,
  STORAGE_TEMP_FOLDER,
} from '../constants/storage.constants';
import type {
  MulterUploadFileLike,
  PersistedMulterFile,
} from '../types/multer-file-like.type';
import type {
  LocalStorageRuntimeDetails,
  MediaStorageDriverContract,
  PersistUploadOptions,
} from '../types/storage.types';
import {
  assertUploadFileSize,
  resolveImageExtension,
} from '../utils/image-file.util';
import {
  buildMediaRelativePath,
  joinPublicMediaPath,
  joinPublicMediaUrl,
  normalizeMediaPublicPath,
  normalizeRelativeMediaPath,
  resolveMediaRootDir,
} from '../utils/media-paths.util';

@Injectable()
export class LocalMediaStorageDriver implements MediaStorageDriverContract {
  readonly driver = 'local' as const;

  constructor(private readonly configService: ConfigService) {}

  private get storageConfig(): LocalStorageConfig {
    const storage = this.configService.storage;

    if (storage.driver !== 'local') {
      throw new Error(
        'LocalMediaStorageDriver was used while STORAGE_DRIVER is not local.',
      );
    }

    return storage;
  }

  private get commonStorageConfig(): StorageConfig {
    return this.configService.storage;
  }

  get localRootDir(): string {
    return resolveMediaRootDir(this.storageConfig.localRootDir);
  }

  get publicPath(): string {
    return normalizeMediaPublicPath(this.commonStorageConfig.publicPath);
  }

  getRuntimeDetails(): LocalStorageRuntimeDetails {
    const storage = this.storageConfig;

    return {
      driver: this.driver,
      localRootDir: this.localRootDir,
      publicPath: this.publicPath,
      publicUrl: storage.publicUrl,
    };
  }

  resolveFolderPath(folder = ''): string {
    const safeFolder = normalizeRelativeMediaPath(folder);
    return safeFolder ? join(this.localRootDir, safeFolder) : this.localRootDir;
  }

  resolveAbsolutePath(relativePath: string): string {
    return join(this.localRootDir, normalizeRelativeMediaPath(relativePath));
  }

  toRelativePath(folder: string, filename: string): string {
    return buildMediaRelativePath(folder, filename);
  }

  toPublicPath(relativePath: string): string {
    return joinPublicMediaPath(
      this.commonStorageConfig.publicPath,
      relativePath,
    );
  }

  toPublicUrl(relativePath: string): string | undefined {
    return joinPublicMediaUrl(this.commonStorageConfig.publicUrl, relativePath);
  }

  async ensureFolder(folder = ''): Promise<string> {
    const folderPath = this.resolveFolderPath(folder);
    await mkdir(folderPath, { recursive: true });
    return folderPath;
  }

  async ensureTempFolder(): Promise<string> {
    return this.ensureFolder(STORAGE_TEMP_FOLDER);
  }

  async assertHealthy(): Promise<void> {
    const folder = await this.ensureFolder(STORAGE_HEALTHCHECK_FOLDER);
    const filename = `.storage-${Date.now()}-${randomUUID()}.tmp`;
    const absolutePath = join(folder, filename);

    await writeFile(absolutePath, 'ok');
    await unlink(absolutePath);
  }

  async persistUpload(
    file: MulterUploadFileLike,
    options: PersistUploadOptions,
  ): Promise<PersistedMulterFile> {
    this.assertUploadIsPresent(file);
    assertUploadFileSize(file, this.storageConfig.fileMaxSizeBytes);

    const folder = normalizeRelativeMediaPath(options.folder);
    const destinationDir = await this.ensureFolder(folder);
    const extension = resolveImageExtension(file);
    const filename = options.filename ?? `${randomUUID()}.${extension}`;
    const relativePath = this.toRelativePath(folder, filename);
    const absolutePath = join(destinationDir, filename);

    if (file.buffer?.length) {
      await writeFile(absolutePath, file.buffer);
    } else if (file.path) {
      await copyFile(file.path, absolutePath);
    }

    const fileStat = await stat(absolutePath);

    return {
      path: absolutePath,
      buffer: file.buffer,
      filename,
      mimetype: file.mimetype ?? 'image/jpeg',
      size: file.size ?? fileStat.size,
      originalname: file.originalname ?? filename,
      relativePath,
      publicPath: this.toPublicPath(relativePath),
      publicUrl: this.toPublicUrl(relativePath),
      storageDriver: this.driver,
      key: relativePath,
    };
  }

  async duplicateRelativePath(
    relativePath: string,
    targetFolder?: string,
  ): Promise<string> {
    const sourceRelativePath = normalizeRelativeMediaPath(relativePath);
    const fallbackFolder = posix.dirname(sourceRelativePath);
    const folder =
      targetFolder !== undefined
        ? normalizeRelativeMediaPath(targetFolder)
        : normalizeRelativeMediaPath(
            fallbackFolder === '.' ? '' : fallbackFolder,
          );

    const extension = extname(sourceRelativePath).toLowerCase();
    const filename = `${randomUUID()}${extension}`;
    const duplicatedRelativePath = this.toRelativePath(folder, filename);

    await this.ensureFolder(folder);
    await copyFile(
      this.resolveAbsolutePath(sourceRelativePath),
      this.resolveAbsolutePath(duplicatedRelativePath),
    );

    return duplicatedRelativePath;
  }

  async deleteMany(relativePaths: string[]): Promise<void> {
    const safePaths = (relativePaths ?? [])
      .filter(Boolean)
      .map(normalizeRelativeMediaPath);

    if (!safePaths.length) {
      return;
    }

    await Promise.all(
      safePaths.map((relativePath) => this.deleteFile(relativePath)),
    );
  }

  private assertUploadIsPresent(file: MulterUploadFileLike): void {
    if (!file?.buffer?.length && !file?.path) {
      throw new BadRequestException({
        title: 'storage.errors.invalid_upload.title',
        description: 'storage.errors.invalid_upload.description',
      });
    }
  }

  private async deleteFile(relativePath: string): Promise<void> {
    try {
      await unlink(this.resolveAbsolutePath(relativePath));
    } catch (error) {
      const code = (error as NodeJS.ErrnoException)?.code;

      if (code !== 'ENOENT') {
        throw error;
      }
    }
  }
}
