// src/infrastructure/storage/pipes/required-image-file.pipe.ts
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class RequiredImageFilePipe implements PipeTransform {
  transform(file?: Express.Multer.File): Express.Multer.File {
    if (!file) {
      throw new BadRequestException({
        title: 'storage.errors.image_required.title',
        description: 'storage.errors.image_required.description',
      });
    }

    return file;
  }
}

@Injectable()
export class RequiredImageFilesPipe implements PipeTransform {
  transform(files?: Express.Multer.File[]): Express.Multer.File[] {
    if (!files?.length) {
      throw new BadRequestException({
        title: 'storage.errors.images_required.title',
        description: 'storage.errors.images_required.description',
      });
    }

    return files;
  }
}
