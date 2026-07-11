// src/infrastructure/storage/utils/download-remote-image-as-file.util.ts
import axios from 'axios';
import { randomUUID } from 'crypto';
import { createWriteStream } from 'fs';
import { mkdir, stat } from 'fs/promises';
import { extname, join } from 'path';
import { finished } from 'stream/promises';
import {
  STORAGE_REMOTE_IMAGE_MAX_REDIRECTS,
  STORAGE_REMOTE_IMAGE_TIMEOUT_MS,
} from '../constants/storage.constants';
import { extFromMime } from './image-file.util';

export type RemoteMulterFile = Pick<
  Express.Multer.File,
  'filename' | 'mimetype' | 'originalname' | 'path' | 'size'
>;

export async function downloadRemoteImageAsMulterFile(params: {
  url: string;
  destinationDir: string;
  originalName?: string;
  timeoutMs?: number;
  maxRedirects?: number;
}): Promise<RemoteMulterFile> {
  const {
    url,
    destinationDir,
    originalName = 'remote-image',
    timeoutMs = STORAGE_REMOTE_IMAGE_TIMEOUT_MS,
    maxRedirects = STORAGE_REMOTE_IMAGE_MAX_REDIRECTS,
  } = params;

  await mkdir(destinationDir, { recursive: true });

  const response = await axios.get(url, {
    responseType: 'stream',
    timeout: timeoutMs,
    maxRedirects,
  });

  const mimeType = String(
    response.headers['content-type'] ?? 'image/jpeg',
  ).toLowerCase();

  if (!mimeType.startsWith('image/')) {
    throw new Error('Remote resource is not an image.');
  }

  const urlExtension = extname(new URL(url).pathname)
    .replace('.', '')
    .toLowerCase();
  const extension = urlExtension || extFromMime(mimeType);
  const filename = `${randomUUID()}.${extension}`;
  const absolutePath = join(destinationDir, filename);
  const writer = createWriteStream(absolutePath);

  response.data.pipe(writer);
  await finished(writer);

  const fileStat = await stat(absolutePath);

  return {
    path: absolutePath,
    filename,
    mimetype: mimeType,
    size: fileStat.size,
    originalname: `${originalName}.${extension}`,
  };
}
