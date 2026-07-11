// src/infrastructure/storage/utils/uploaded-images.util.ts
import { createHash } from 'crypto';
import { createReadStream } from 'fs';
import { extname } from 'path';
import type { PersistedMulterFile } from '../types/multer-file-like.type';

export type UploadedImagePayload = {
  path: string;
  publicPath: string;
  publicUrl?: string;
  originalName: string;
  mimeType: string;
  sizeBytes: string;
  extension: string;
  width: number | null;
  height: number | null;
  checksumSha256: string | null;
  order: number;
};

type ImageSize = {
  width: number | null;
  height: number | null;
};

async function sha256File(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(filePath);

    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

function sha256Buffer(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

async function sha256PersistedFile(
  file: PersistedMulterFile,
): Promise<string | null> {
  if (file.buffer?.length) {
    return sha256Buffer(file.buffer);
  }

  if (file.path) {
    return sha256File(file.path);
  }

  return null;
}

async function tryReadImageSize(file: PersistedMulterFile): Promise<ImageSize> {
  try {
    const sharp = (await import('sharp')).default;
    const source = file.buffer?.length ? file.buffer : file.path;

    if (!source) {
      return {
        width: null,
        height: null,
      };
    }

    const metadata = await sharp(source).metadata();

    return {
      width: metadata.width ?? null,
      height: metadata.height ?? null,
    };
  } catch {
    return {
      width: null,
      height: null,
    };
  }
}

function resolveExtension(file: PersistedMulterFile): string {
  return (
    extname(file.filename || file.originalname)
      .replace('.', '')
      .toLowerCase() || 'jpg'
  );
}

export async function buildUploadedImagePayloads(
  files: PersistedMulterFile[],
  options: {
    startOrder?: number;
    withChecksum?: boolean;
    withDimensions?: boolean;
  } = {},
): Promise<UploadedImagePayload[]> {
  const startOrder = options.startOrder ?? 0;
  const withChecksum = options.withChecksum ?? true;
  const withDimensions = options.withDimensions ?? true;

  const payloads: UploadedImagePayload[] = [];

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];

    const extension = resolveExtension(file);

    const imageSize = withDimensions
      ? await tryReadImageSize(file)
      : {
          width: null,
          height: null,
        };

    const checksumSha256 = withChecksum
      ? await sha256PersistedFile(file)
      : null;

    payloads.push({
      path: file.relativePath,
      publicPath: file.publicPath,
      publicUrl: file.publicUrl,
      originalName: (file.originalname ?? '').slice(0, 256),
      mimeType: (file.mimetype ?? '').slice(0, 128),
      sizeBytes: String(file.size ?? 0),
      extension: extension.slice(0, 16),
      width: imageSize.width,
      height: imageSize.height,
      checksumSha256,
      order: startOrder + index,
    });
  }

  return payloads;
}
