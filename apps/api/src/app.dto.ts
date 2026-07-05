// src/app.dto.ts
import { Expose, Type } from 'class-transformer';
import type { NodeEnv, StorageDriver } from 'src/config/env/env.types';

export interface AppHomePayload {
  name: string;
  version: string;
  environment: NodeEnv;
  status: 'ok';
}

export interface AppStorageInfoPayload {
  driver: StorageDriver;
  publicPath: string;
  publicUrl: string | null;
  fileMaxSizeBytes: number;
  fileAllowedMimeTypes: string[];
  fileMaxFilesPerRequest: number;
  localRootDir?: string;
  awsS3BucketName?: string;
  awsS3Region?: string;
  awsS3Endpoint?: string | null;
}

export interface AppInfoPayload extends AppHomePayload {
  apiBasePath: string;
  frontendPublicUrl: string;
  publicUrl: string | null;
  startedAt: string;
  features: {
    swagger: boolean;
    healthChecks: boolean;
    compression: boolean;
    cache: boolean;
    metrics: boolean;
  };
  security: {
    corsAllowedOrigins: string[];
    corsCredentials: boolean;
    rateLimitTtlSeconds: number;
    rateLimitMaxRequests: number;
    throttleTtlSeconds: number;
    throttleLimit: number;
  };
  storage: AppStorageInfoPayload;
}

export class AppHomeDto {
  @Expose()
  name!: string;

  @Expose()
  version!: string;

  @Expose()
  environment!: NodeEnv;

  @Expose()
  status!: 'ok';

  static from(payload: AppHomePayload): AppHomeDto {
    return Object.assign(new AppHomeDto(), payload);
  }
}

export class AppFeatureInfoDto {
  @Expose()
  swagger!: boolean;

  @Expose()
  healthChecks!: boolean;

  @Expose()
  compression!: boolean;

  @Expose()
  cache!: boolean;

  @Expose()
  metrics!: boolean;
}

export class AppSecurityInfoDto {
  @Expose()
  corsAllowedOrigins!: string[];

  @Expose()
  corsCredentials!: boolean;

  @Expose()
  rateLimitTtlSeconds!: number;

  @Expose()
  rateLimitMaxRequests!: number;

  @Expose()
  throttleTtlSeconds!: number;

  @Expose()
  throttleLimit!: number;
}

export class AppStorageInfoDto {
  @Expose()
  driver!: StorageDriver;

  @Expose()
  publicPath!: string;

  @Expose()
  publicUrl!: string | null;

  @Expose()
  fileMaxSizeBytes!: number;

  @Expose()
  fileAllowedMimeTypes!: string[];

  @Expose()
  fileMaxFilesPerRequest!: number;

  @Expose()
  localRootDir?: string;

  @Expose()
  awsS3BucketName?: string;

  @Expose()
  awsS3Region?: string;

  @Expose()
  awsS3Endpoint?: string | null;
}

export class AppInfoDto extends AppHomeDto {
  @Expose()
  apiBasePath!: string;

  @Expose()
  frontendPublicUrl!: string;

  @Expose()
  publicUrl!: string | null;

  @Expose()
  startedAt!: string;

  @Expose()
  @Type(() => AppFeatureInfoDto)
  features!: AppFeatureInfoDto;

  @Expose()
  @Type(() => AppSecurityInfoDto)
  security!: AppSecurityInfoDto;

  @Expose()
  @Type(() => AppStorageInfoDto)
  storage!: AppStorageInfoDto;

  static from(payload: AppInfoPayload): AppInfoDto {
    return Object.assign(new AppInfoDto(), payload);
  }
}
