// src/infrastructure/storage/constants/storage.constants.ts
export const DEFAULT_IMAGE_UPLOAD_FIELD = 'image';
export const DEFAULT_IMAGES_UPLOAD_FIELD = 'images';

export const STORAGE_HEALTHCHECK_FOLDER = '.healthchecks';
export const STORAGE_TEMP_FOLDER = '.tmp';
export const STORAGE_S3_TEMP_ROOT_FOLDER = 'nestjs-storage';

export const STORAGE_DEFAULT_IMAGE_MIME_TYPE = 'image/jpeg';
export const STORAGE_DEFAULT_IMAGE_EXTENSION = 'jpg';

export const STORAGE_REMOTE_IMAGE_TIMEOUT_MS = 15_000;
export const STORAGE_REMOTE_IMAGE_MAX_REDIRECTS = 5;

export const MEDIA_STORAGE_DRIVER = Symbol('MEDIA_STORAGE_DRIVER');
