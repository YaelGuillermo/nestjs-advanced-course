// src/config/loaders/storage.config.ts
import { registerAs } from '@nestjs/config';
import { getValidatedEnv } from '../env/env.validation';
import type { StorageConfig } from '../types/config.types';
import { freezeConfig, requiredEnvValue } from '../utils/loader.utils';

export default registerAs('storage', (): StorageConfig => {
  const env = getValidatedEnv();
  const base = {
    publicPath: env.STORAGE_PUBLIC_PATH,
    publicUrl: env.STORAGE_PUBLIC_URL ?? null,
    fileMaxSizeBytes: env.FILE_MAX_SIZE_BYTES,
    fileAllowedMimeTypes: [...env.FILE_ALLOWED_MIME_TYPES],
    fileMaxFilesPerRequest: env.FILE_MAX_FILES_PER_REQUEST,
  };

  if (env.STORAGE_DRIVER === 's3') {
    return freezeConfig({
      ...base,
      driver: 's3',
      awsAccessKeyId: requiredEnvValue(
        env.AWS_ACCESS_KEY_ID,
        'AWS_ACCESS_KEY_ID',
      ),
      awsSecretAccessKey: requiredEnvValue(
        env.AWS_SECRET_ACCESS_KEY,
        'AWS_SECRET_ACCESS_KEY',
      ),
      awsS3BucketName: requiredEnvValue(
        env.AWS_S3_BUCKET_NAME,
        'AWS_S3_BUCKET_NAME',
      ),
      awsS3Region: env.AWS_S3_REGION,
      awsS3Endpoint: env.AWS_S3_ENDPOINT ?? null,
      awsS3ForcePathStyle: env.AWS_S3_FORCE_PATH_STYLE,
      awsS3SignatureVersion: env.AWS_S3_SIGNATURE_VERSION,
    });
  }

  return freezeConfig({
    ...base,
    driver: 'local',
    localRootDir: env.STORAGE_LOCAL_ROOT_DIR,
  });
});
