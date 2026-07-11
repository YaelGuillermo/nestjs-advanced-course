// src/infrastructure/storage/drivers/s3-media-storage.driver.ts
import {
  BadRequestException,
  Injectable,
  Logger,
  NotImplementedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, readFile } from 'fs/promises';
import { tmpdir } from 'os';
import { extname, join, posix } from 'path';
import { ConfigService } from 'src/config/config.service';
import type {
  S3StorageConfig,
  StorageConfig,
} from 'src/config/types/config.types';
import {
  STORAGE_S3_TEMP_ROOT_FOLDER,
  STORAGE_TEMP_FOLDER,
} from '../constants/storage.constants';
import type {
  MulterUploadFileLike,
  PersistedMulterFile,
} from '../types/multer-file-like.type';
import type {
  MediaStorageDriverContract,
  PersistUploadOptions,
  S3StorageRuntimeDetails,
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
} from '../utils/media-paths.util';

type AwsS3ClientModule = {
  S3Client: new (args: Record<string, unknown>) => {
    send(command: unknown): Promise<unknown>;
  };
  PutObjectCommand: new (args: Record<string, unknown>) => unknown;
  DeleteObjectCommand: new (args: Record<string, unknown>) => unknown;
  CopyObjectCommand: new (args: Record<string, unknown>) => unknown;
  HeadBucketCommand: new (args: Record<string, unknown>) => unknown;
};

async function importAwsS3Client(): Promise<AwsS3ClientModule> {
  const dynamicImport = new Function(
    'modulePath',
    'return import(modulePath)',
  ) as (modulePath: string) => Promise<AwsS3ClientModule>;

  return dynamicImport('@aws-sdk/client-s3');
}

@Injectable()
export class S3MediaStorageDriver implements MediaStorageDriverContract {
  readonly driver = 's3' as const;

  private readonly logger = new Logger(S3MediaStorageDriver.name);
  private s3ModulePromise: Promise<AwsS3ClientModule> | null = null;

  constructor(private readonly configService: ConfigService) {}

  private get storageConfig(): S3StorageConfig {
    const storage = this.configService.storage;

    if (storage.driver !== 's3') {
      throw new Error(
        'S3MediaStorageDriver was used while STORAGE_DRIVER is not s3.',
      );
    }

    return storage;
  }

  private get commonStorageConfig(): StorageConfig {
    return this.configService.storage;
  }

  get publicPath(): string {
    return normalizeMediaPublicPath(this.commonStorageConfig.publicPath);
  }

  getRuntimeDetails(): S3StorageRuntimeDetails {
    const storage = this.storageConfig;

    return {
      driver: this.driver,
      bucketName: storage.awsS3BucketName,
      region: storage.awsS3Region,
      endpoint: storage.awsS3Endpoint,
      forcePathStyle: storage.awsS3ForcePathStyle,
      publicPath: this.publicPath,
      publicUrl: storage.publicUrl,
    };
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

  async ensureTempFolder(): Promise<string> {
    const folderPath = join(
      tmpdir(),
      STORAGE_S3_TEMP_ROOT_FOLDER,
      STORAGE_TEMP_FOLDER,
    );

    await mkdir(folderPath, { recursive: true });
    return folderPath;
  }

  async assertHealthy(): Promise<void> {
    const { S3Client, HeadBucketCommand } = await this.getAwsS3Module();
    const client = this.createS3Client(S3Client);

    await client.send(
      new HeadBucketCommand({ Bucket: this.storageConfig.awsS3BucketName }),
    );
  }

  async persistUpload(
    file: MulterUploadFileLike,
    options: PersistUploadOptions,
  ): Promise<PersistedMulterFile> {
    this.assertUploadIsPresent(file);
    assertUploadFileSize(file, this.storageConfig.fileMaxSizeBytes);

    const { S3Client, PutObjectCommand } = await this.getAwsS3Module();
    const folder = normalizeRelativeMediaPath(options.folder);
    const extension = resolveImageExtension(file);
    const filename = options.filename ?? `${randomUUID()}.${extension}`;
    const relativePath = this.toRelativePath(folder, filename);
    const body =
      file.buffer ?? (file.path ? await readFile(file.path) : undefined);

    if (!body) {
      throw new BadRequestException({
        title: 'storage.errors.invalid_upload.title',
        description: 'storage.errors.invalid_upload.description',
      });
    }

    const client = this.createS3Client(S3Client);

    await client.send(
      new PutObjectCommand({
        Bucket: this.storageConfig.awsS3BucketName,
        Key: relativePath,
        Body: body,
        ContentType: file.mimetype ?? 'application/octet-stream',
      }),
    );

    return {
      path: file.path,
      buffer: Buffer.isBuffer(body) ? body : undefined,
      filename,
      mimetype: file.mimetype ?? 'application/octet-stream',
      size: file.size ?? body.length,
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

    await this.copyObject(sourceRelativePath, duplicatedRelativePath);
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
      safePaths.map((relativePath) => this.deleteObject(relativePath)),
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

  private async deleteObject(relativePath: string): Promise<void> {
    const { S3Client, DeleteObjectCommand } = await this.getAwsS3Module();
    const client = this.createS3Client(S3Client);

    await client.send(
      new DeleteObjectCommand({
        Bucket: this.storageConfig.awsS3BucketName,
        Key: relativePath,
      }),
    );
  }

  private async copyObject(
    sourceRelativePath: string,
    targetRelativePath: string,
  ): Promise<void> {
    const { S3Client, CopyObjectCommand } = await this.getAwsS3Module();
    const storage = this.storageConfig;
    const client = this.createS3Client(S3Client);

    await client.send(
      new CopyObjectCommand({
        Bucket: storage.awsS3BucketName,
        CopySource: this.buildCopySource(
          storage.awsS3BucketName,
          sourceRelativePath,
        ),
        Key: targetRelativePath,
      }),
    );
  }

  private buildCopySource(bucketName: string, key: string): string {
    const encodedKey = key.split('/').map(encodeURIComponent).join('/');
    return `${bucketName}/${encodedKey}`;
  }

  private createS3Client(S3Client: AwsS3ClientModule['S3Client']) {
    const storage = this.storageConfig;

    return new S3Client({
      region: storage.awsS3Region,
      endpoint: storage.awsS3Endpoint ?? undefined,
      forcePathStyle: storage.awsS3ForcePathStyle,
      credentials: {
        accessKeyId: storage.awsAccessKeyId,
        secretAccessKey: storage.awsSecretAccessKey,
      },
    });
  }

  private async getAwsS3Module(): Promise<AwsS3ClientModule> {
    try {
      this.s3ModulePromise ??= importAwsS3Client();
      return await this.s3ModulePromise;
    } catch (error) {
      this.s3ModulePromise = null;
      this.logger.error(
        'AWS S3 SDK is required when STORAGE_DRIVER=s3.',
        error instanceof Error ? error.stack : undefined,
      );
      throw new NotImplementedException(
        'Install @aws-sdk/client-s3 to use STORAGE_DRIVER=s3.',
      );
    }
  }
}
