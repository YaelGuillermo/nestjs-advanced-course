// src/infrastructure/storage/utils/image-file.util.ts
import { extname } from 'path';
import {
  STORAGE_DEFAULT_IMAGE_EXTENSION,
  STORAGE_DEFAULT_IMAGE_MIME_TYPE,
} from '../constants/storage.constants';
import type { MulterUploadFileLike } from '../types/multer-file-like.type';

const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
};

export function normalizeFileType(value: string): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/^\./, '');
}

export function extFromMime(mime?: string): string {
  if (!mime) return STORAGE_DEFAULT_IMAGE_EXTENSION;
  return (
    MIME_EXTENSION_MAP[mime.toLowerCase()] ?? STORAGE_DEFAULT_IMAGE_EXTENSION
  );
}

export function mimeFromExtension(extension?: string): string {
  const normalized = normalizeFileType(extension ?? '');
  const match = Object.entries(MIME_EXTENSION_MAP).find(
    ([, ext]) => ext === normalized,
  );

  return match?.[0] ?? STORAGE_DEFAULT_IMAGE_MIME_TYPE;
}

export function resolveImageExtension(file: MulterUploadFileLike): string {
  const originalExtension = extname(file.originalname ?? '')
    .replace('.', '')
    .toLowerCase();

  return originalExtension || extFromMime(file.mimetype);
}

export function assertUploadFileSize(
  file: MulterUploadFileLike,
  maxSizeBytes: number,
): void {
  const size = Number(file.size ?? file.buffer?.length ?? 0);

  if (maxSizeBytes > 0 && size > maxSizeBytes) {
    throw new Error(`File exceeds maximum size of ${maxSizeBytes} bytes.`);
  }
}

export function isAllowedImageFile(
  file: MulterUploadFileLike,
  allowedMimeTypesOrExtensions: string[],
): boolean {
  const mimeType = String(file.mimetype ?? '').toLowerCase();

  if (!mimeType.startsWith('image/')) {
    return false;
  }

  if (!allowedMimeTypesOrExtensions.length) {
    return true;
  }

  const extension = resolveImageExtension(file);

  return allowedMimeTypesOrExtensions.some((allowed) => {
    const normalized = normalizeFileType(allowed);

    return (
      normalized === mimeType ||
      normalized === extension ||
      normalized === `image/${extension}` ||
      (normalized === 'jpeg' && extension === 'jpg') ||
      (normalized === 'jpg' && mimeType === 'image/jpeg')
    );
  });
}
