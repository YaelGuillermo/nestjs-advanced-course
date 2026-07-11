// src/infrastructure/storage/storage.module.ts
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from 'src/config/config.module';
import { LocalMediaStorageDriver } from './drivers/local-media-storage.driver';
import { S3MediaStorageDriver } from './drivers/s3-media-storage.driver';
import { MediaStorageDriverProvider } from './providers/media-storage-driver.provider';
import { ImageAttachmentService } from './services/image-attachment.service';
import { ImageIngestService } from './services/image-ingest.service';
import { MediaStorageService } from './services/media-storage.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    LocalMediaStorageDriver,
    S3MediaStorageDriver,
    MediaStorageDriverProvider,
    MediaStorageService,
    ImageIngestService,
    ImageAttachmentService,
  ],
  exports: [MediaStorageService, ImageIngestService, ImageAttachmentService],
})
export class StorageModule {}
