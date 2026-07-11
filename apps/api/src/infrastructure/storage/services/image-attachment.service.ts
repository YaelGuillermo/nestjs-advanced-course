// src/infrastructure/storage/services/image-attachment.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { ImageEntity } from 'src/common/entities/image.entity';
import {
  DataSource,
  DeepPartial,
  EntityTarget,
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import type { MulterUploadFileLike } from '../types/multer-file-like.type';
import type { UploadedImagePayload } from '../utils/uploaded-images.util';
import { ImageIngestService } from './image-ingest.service';
import { MediaStorageService } from './media-storage.service';

export type ImageAttachmentLimitSnapshot = {
  current: number;
  maximum: number;
  remaining: number;
  canCreate: boolean;
};

type BaseImageEntity = ImageEntity & ObjectLiteral;
type ImageWhere<TImage extends BaseImageEntity> = FindOptionsWhere<TImage>;

type ReplaceOneImageParams<TImage extends BaseImageEntity> = {
  entity: EntityTarget<TImage>;
  ownerField: keyof TImage & string;
  ownerId: string;
  file: MulterUploadFileLike;
  folder: string;
  where?: ImageWhere<TImage>;
  extra?: DeepPartial<TImage>;
  deletePreviousFile?: boolean;
};

type AppendManyImagesParams<TImage extends BaseImageEntity> = {
  entity: EntityTarget<TImage>;
  ownerField: keyof TImage & string;
  ownerId: string;
  files: MulterUploadFileLike[];
  folder: string;
  maximum: number;
  where?: ImageWhere<TImage>;
  extra?: DeepPartial<TImage>;
  includeOrder?: boolean;
};

type CountImagesParams<TImage extends BaseImageEntity> = {
  entity: EntityTarget<TImage>;
  ownerField: keyof TImage & string;
  ownerId: string;
  maximum: number;
  where?: ImageWhere<TImage>;
};

@Injectable()
export class ImageAttachmentService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly imageIngestService: ImageIngestService,
    private readonly mediaStorageService: MediaStorageService,
  ) {}

  private getRepository<TImage extends BaseImageEntity>(
    entity: EntityTarget<TImage>,
  ): Repository<TImage> {
    return this.dataSource.getRepository(entity);
  }

  private buildOwnerWhere<TImage extends BaseImageEntity>(params: {
    ownerField: keyof TImage & string;
    ownerId: string;
    where?: ImageWhere<TImage>;
  }): ImageWhere<TImage> {
    return {
      ...(params.where ?? {}),
      [params.ownerField]: params.ownerId,
    } as ImageWhere<TImage>;
  }

  private withoutOrder(
    payload: UploadedImagePayload,
  ): Omit<UploadedImagePayload, 'order'> {
    const { order: _order, ...rest } = payload;
    return rest;
  }

  private buildLimitSnapshot(
    current: number,
    maximum: number,
  ): ImageAttachmentLimitSnapshot {
    const remaining = Math.max(0, maximum - current);

    return {
      current,
      maximum,
      remaining,
      canCreate: remaining > 0,
    };
  }

  async findLimitSnapshot<TImage extends BaseImageEntity>(
    params: CountImagesParams<TImage>,
  ): Promise<ImageAttachmentLimitSnapshot> {
    const repository = this.getRepository(params.entity);
    const where = this.buildOwnerWhere(params);
    const current = await repository.count({ where });

    return this.buildLimitSnapshot(current, params.maximum);
  }

  async replaceOne<TImage extends BaseImageEntity>(
    params: ReplaceOneImageParams<TImage>,
  ): Promise<TImage> {
    const repository = this.getRepository(params.entity);
    const where = this.buildOwnerWhere(params);
    const existing = await repository.findOne({ where });
    const previousPath = existing?.path ?? null;
    const uploaded = await this.imageIngestService.ingestOne(params.file, {
      folder: params.folder,
      startOrder: 0,
      withChecksum: true,
      withDimensions: true,
    });

    const payload = {
      ...this.withoutOrder(uploaded),
      [params.ownerField]: params.ownerId,
      ...(params.extra ?? {}),
    } as DeepPartial<TImage>;

    const saved = existing
      ? await repository.save(repository.merge(existing, payload))
      : await repository.save(repository.create(payload));

    const shouldDeletePreviousFile = params.deletePreviousFile ?? true;

    if (
      shouldDeletePreviousFile &&
      previousPath &&
      previousPath !== saved.path
    ) {
      await this.mediaStorageService.deleteMany([previousPath]);
    }

    return saved;
  }

  async appendMany<TImage extends BaseImageEntity>(
    params: AppendManyImagesParams<TImage>,
  ): Promise<TImage[]> {
    const files = params.files ?? [];

    if (!files.length) {
      throw new BadRequestException({
        title: 'storage.errors.images_required.title',
        description: 'storage.errors.images_required.description',
      });
    }

    const repository = this.getRepository(params.entity);
    const where = this.buildOwnerWhere(params);
    const current = await repository.count({ where });

    if (current + files.length > params.maximum) {
      throw new BadRequestException({
        title: 'storage.errors.image_limit_reached.title',
        description: 'storage.errors.image_limit_reached.description',
        args: {
          current,
          maximum: params.maximum,
          incoming: files.length,
          remaining: Math.max(0, params.maximum - current),
        },
      });
    }

    const uploadedPayloads = await this.imageIngestService.ingestMany(files, {
      folder: params.folder,
      startOrder: current,
      withChecksum: true,
      withDimensions: true,
    });

    const entities = uploadedPayloads.map((uploaded) => {
      const basePayload =
        params.includeOrder === false ? this.withoutOrder(uploaded) : uploaded;

      return repository.create({
        ...basePayload,
        [params.ownerField]: params.ownerId,
        ...(params.extra ?? {}),
      } as DeepPartial<TImage>);
    });

    return repository.save(entities);
  }
}
