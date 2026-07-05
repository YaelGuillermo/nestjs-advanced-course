// src/app.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from 'src/config/config.service';
import type { StorageConfig } from 'src/config/types/config.types';
import type {
  AppHomePayload,
  AppInfoPayload,
  AppStorageInfoPayload,
} from './app.dto';

@Injectable()
export class AppService implements OnModuleInit {
  private readonly logger = new Logger(AppService.name);
  private readonly startedAt = new Date();

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const { app, api, storage } = this.configService;

    this.logger.log(
      `Application module initialized: ${app.name}@${app.version} env=${app.nodeEnv} api=/${api.fullPrefix} storage=${storage.driver}`,
    );
  }

  getHome(): AppHomePayload {
    const { app } = this.configService;

    return {
      name: app.name,
      version: app.version,
      environment: app.nodeEnv,
      status: 'ok',
    };
  }

  getInfo(): AppInfoPayload {
    const { app, features, observability, security } = this.configService;

    return {
      ...this.getHome(),
      apiBasePath: this.configService.apiBasePath,
      frontendPublicUrl: app.frontendPublicUrl,
      publicUrl: app.publicUrl,
      startedAt: this.startedAt.toISOString(),
      features: {
        swagger: features.swaggerEnabled,
        healthChecks: features.healthChecksEnabled,
        compression: features.compressionEnabled,
        cache: features.cacheEnabled,
        metrics: observability.metricsEnabled,
      },
      security: {
        corsAllowedOrigins: [...security.corsAllowedOrigins],
        corsCredentials: security.corsCredentials,
        rateLimitTtlSeconds: security.rateLimitTtlSeconds,
        rateLimitMaxRequests: security.rateLimitMaxRequests,
        throttleTtlSeconds: security.throttleTtlSeconds,
        throttleLimit: security.throttleLimit,
      },
      storage: this.buildStorageInfo(this.configService.storage),
    };
  }

  private buildStorageInfo(storage: StorageConfig): AppStorageInfoPayload {
    const base = {
      driver: storage.driver,
      publicPath: storage.publicPath,
      publicUrl: storage.publicUrl,
      fileMaxSizeBytes: storage.fileMaxSizeBytes,
      fileAllowedMimeTypes: [...storage.fileAllowedMimeTypes],
      fileMaxFilesPerRequest: storage.fileMaxFilesPerRequest,
    };

    if (storage.driver === 'local') {
      return {
        ...base,
        localRootDir: storage.localRootDir,
      };
    }

    return {
      ...base,
      awsS3BucketName: storage.awsS3BucketName,
      awsS3Region: storage.awsS3Region,
      awsS3Endpoint: storage.awsS3Endpoint,
    };
  }
}
