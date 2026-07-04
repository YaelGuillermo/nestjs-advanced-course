// src/config/loaders/database.config.ts
import { registerAs } from '@nestjs/config';
import { getValidatedEnv } from '../env/env.validation';
import type { DatabaseConfig } from '../types/config.types';
import { freezeConfig } from '../utils/loader.utils';

export default registerAs('database', (): DatabaseConfig => {
  const env = getValidatedEnv();

  return freezeConfig({
    host: env.DB_HOST,
    port: env.DB_PORT,
    name: env.DB_NAME,
    username: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    schema: env.DB_SCHEMA,
    synchronize: env.DB_SYNCHRONIZE,
    dropSchema: env.DB_DROP_SCHEMA,
    logging: env.DB_LOGGING,
    ssl: env.DB_SSL,
    maxConnections: env.DB_MAX_CONNECTIONS,
    idleTimeoutMs: env.DB_IDLE_TIMEOUT_MS,
    connectionTimeoutMs: env.DB_CONNECTION_TIMEOUT_MS,
    runMigrations: env.DB_RUN_MIGRATIONS,
    adminDatabase: env.DB_ADMIN_DATABASE,
  });
});
