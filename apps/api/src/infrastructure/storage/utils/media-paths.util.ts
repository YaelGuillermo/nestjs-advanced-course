// src/infrastructure/storage/utils/media-paths.util.ts
import { isAbsolute, join, posix } from 'path';

function sanitizeSlashes(value: string): string {
  return String(value ?? '')
    .trim()
    .replace(/\\/g, '/');
}

function assertSafeRelativePath(value: string): string {
  const normalized = posix
    .normalize(sanitizeSlashes(value))
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');

  if (!normalized || normalized === '.') {
    return '';
  }

  if (
    normalized === '..' ||
    normalized.startsWith('../') ||
    normalized.includes('/../')
  ) {
    throw new Error(`Unsafe media path: ${value}`);
  }

  return normalized;
}

export function resolveMediaRootDir(localRootDir: string): string {
  const rootDir = String(localRootDir || 'uploads').trim();
  return isAbsolute(rootDir) ? rootDir : join(process.cwd(), rootDir);
}

export function normalizeMediaPublicPath(publicPath: string): string {
  const normalized = sanitizeSlashes(publicPath || 'media')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');

  return `/${normalized || 'media'}`;
}

export function normalizeRelativeMediaPath(value: string): string {
  return assertSafeRelativePath(value);
}

export function buildMediaRelativePath(
  folder: string,
  filename: string,
): string {
  const safeFolder = normalizeRelativeMediaPath(folder);
  const safeFilename = normalizeRelativeMediaPath(filename);

  if (!safeFilename) {
    throw new Error('Invalid media filename.');
  }

  return safeFolder ? `${safeFolder}/${safeFilename}` : safeFilename;
}

export function joinPublicMediaPath(
  publicPath: string,
  relativePath: string,
): string {
  return `${normalizeMediaPublicPath(publicPath)}/${normalizeRelativeMediaPath(relativePath)}`;
}

export function joinPublicMediaUrl(
  publicUrl: string | null | undefined,
  relativePath: string,
): string | undefined {
  if (!publicUrl) return undefined;

  const baseUrl = publicUrl.replace(/\/+$/, '');
  return `${baseUrl}/${normalizeRelativeMediaPath(relativePath)}`;
}
