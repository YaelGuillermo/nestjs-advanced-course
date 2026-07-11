// src/infrastructure/storage/services/image-ingest.service.ts
import { Injectable } from '@nestjs/common';
import type { MulterUploadFileLike } from '../types/multer-file-like.type';
import type { PersistRemoteImageOptions } from '../types/storage.types';
import { downloadRemoteImageAsMulterFile } from '../utils/download-remote-image-as-file.util';
import { normalizeRelativeMediaPath } from '../utils/media-paths.util';
import {
  buildUploadedImagePayloads,
  type UploadedImagePayload,
} from '../utils/uploaded-images.util';
import { MediaStorageService } from './media-storage.service';

@Injectable()
export class ImageIngestService {
  constructor(private readonly mediaStorage: MediaStorageService) {}

  async ingestOne(
    file: MulterUploadFileLike,
    options: {
      folder: string;
      startOrder?: number;
      withChecksum?: boolean;
      withDimensions?: boolean;
    },
  ): Promise<UploadedImagePayload> {
    const [payload] = await this.ingestMany([file], options);
    return payload;
  }

  async ingestMany(
    files: MulterUploadFileLike[],
    options: {
      folder: string;
      startOrder?: number;
      withChecksum?: boolean;
      withDimensions?: boolean;
    },
  ): Promise<UploadedImagePayload[]> {
    if (!files?.length) {
      return [];
    }

    const folder = normalizeRelativeMediaPath(options.folder);
    const persistedFiles = await Promise.all(
      files.map((file) => this.mediaStorage.persistUpload(file, { folder })),
    );

    return buildUploadedImagePayloads(persistedFiles, {
      startOrder: options.startOrder ?? 0,
      withChecksum: options.withChecksum ?? true,
      withDimensions: options.withDimensions ?? true,
    });
  }

  async ingestRemote(
    options: PersistRemoteImageOptions,
  ): Promise<UploadedImagePayload> {
    const tempDir = await this.mediaStorage.ensureTempFolder();
    const remoteFile = await downloadRemoteImageAsMulterFile({
      url: options.url,
      destinationDir: tempDir,
      originalName: options.originalName ?? 'remote-image',
    });

    try {
      return await this.ingestOne(remoteFile, {
        folder: options.folder,
        startOrder: 0,
        withChecksum: true,
        withDimensions: true,
      });
    } finally {
      await this.mediaStorage.deleteTemporaryFile(remoteFile.path);
    }
  }
}
