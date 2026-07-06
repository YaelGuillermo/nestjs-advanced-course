// src/database/database-cli.config.ts
import { loadEnvFilesForCli } from 'src/config/env/env-files';
import { validateEnv } from 'src/config/env/env.validation';
import databaseConfig from 'src/config/loaders/database.config';
import type { DatabaseConfig } from 'src/config/types/config.types';

let cachedDatabaseConfig: DatabaseConfig | null = null;

/**
 * Loads .env files and returns the same validated DatabaseConfig produced by
 * src/config/loaders/database.config.ts.
 *
 * This is for TypeORM CLI and standalone scripts, where Nest DI does not exist.
 */
export function loadDatabaseConfigForCli(): DatabaseConfig {
  if (cachedDatabaseConfig) {
    return cachedDatabaseConfig;
  }

  loadEnvFilesForCli();
  validateEnv(process.env);

  cachedDatabaseConfig = databaseConfig();
  return cachedDatabaseConfig;
}
