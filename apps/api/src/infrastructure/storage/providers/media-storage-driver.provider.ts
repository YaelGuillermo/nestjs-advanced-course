// src/infrastructure/storage/providers/media-storage-driver.provider.ts
import type { Provider } from '@nestjs/common';
import { ConfigService } from 'src/config/config.service';
import { MEDIA_STORAGE_DRIVER } from '../constants/storage.constants';
import { LocalMediaStorageDriver } from '../drivers/local-media-storage.driver';
import { S3MediaStorageDriver } from '../drivers/s3-media-storage.driver';
import type { MediaStorageDriverContract } from '../types/storage.types';

export const MediaStorageDriverProvider: Provider<MediaStorageDriverContract> =
  {
    provide: MEDIA_STORAGE_DRIVER,
    useFactory: (
      configService: ConfigService,
      localDriver: LocalMediaStorageDriver,
      s3Driver: S3MediaStorageDriver,
    ): MediaStorageDriverContract => {
      const storage = configService.storage;

      switch (storage.driver) {
        case 'local':
          return localDriver;
        case 's3':
          return s3Driver;
        default: {
          const exhaustiveCheck: never = storage;
          throw new Error(
            `Unsupported storage driver: ${String(exhaustiveCheck)}`,
          );
        }
      }
    },
    inject: [ConfigService, LocalMediaStorageDriver, S3MediaStorageDriver],
  };
