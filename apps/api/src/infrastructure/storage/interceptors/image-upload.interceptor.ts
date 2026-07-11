// src/infrastructure/storage/interceptors/image-upload.interceptor.ts
import {
  BadRequestException,
  Injectable,
  mixin,
  NestInterceptor,
  Type,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';
import { ConfigService } from 'src/config/config.service';
import {
  DEFAULT_IMAGE_UPLOAD_FIELD,
  DEFAULT_IMAGES_UPLOAD_FIELD,
} from '../constants/storage.constants';
import { isAllowedImageFile } from '../utils/image-file.util';

export type ImageUploadInterceptorOptions = {
  fieldName?: string;
  maxCount?: number;
};

function buildImageMulterOptions(configService: ConfigService): MulterOptions {
  const storage = configService.storage;

  return {
    storage: memoryStorage(),
    limits: {
      fileSize: storage.fileMaxSizeBytes,
      files: storage.fileMaxFilesPerRequest,
    },
    fileFilter: (_request, file, callback) => {
      const isAllowed = isAllowedImageFile(file, storage.fileAllowedMimeTypes);

      if (!isAllowed) {
        callback(
          new BadRequestException({
            title: 'storage.errors.invalid_image_type.title',
            description: 'storage.errors.invalid_image_type.description',
            args: {
              allowedMimeTypes: storage.fileAllowedMimeTypes,
              receivedMimeType: file.mimetype,
            },
          }),
          false,
        );
        return;
      }

      callback(null, true);
    },
  };
}

export function ImageFileInterceptor(
  fieldName = DEFAULT_IMAGE_UPLOAD_FIELD,
): Type<NestInterceptor> {
  @Injectable()
  class ImageFileMixinInterceptor implements NestInterceptor {
    private readonly interceptor: NestInterceptor;

    constructor(configService: ConfigService) {
      const InterceptorClass = FileInterceptor(
        fieldName,
        buildImageMulterOptions(configService),
      );
      this.interceptor = new InterceptorClass();
    }

    intercept(...args: Parameters<NestInterceptor['intercept']>) {
      return this.interceptor.intercept(...args);
    }
  }

  return mixin(ImageFileMixinInterceptor);
}

export function ImageFilesInterceptor(
  options: ImageUploadInterceptorOptions = {},
): Type<NestInterceptor> {
  @Injectable()
  class ImageFilesMixinInterceptor implements NestInterceptor {
    private readonly interceptor: NestInterceptor;

    constructor(configService: ConfigService) {
      const storage = configService.storage;
      const InterceptorClass = FilesInterceptor(
        options.fieldName ?? DEFAULT_IMAGES_UPLOAD_FIELD,
        options.maxCount ?? storage.fileMaxFilesPerRequest,
        buildImageMulterOptions(configService),
      );

      this.interceptor = new InterceptorClass();
    }

    intercept(...args: Parameters<NestInterceptor['intercept']>) {
      return this.interceptor.intercept(...args);
    }
  }

  return mixin(ImageFilesMixinInterceptor);
}
