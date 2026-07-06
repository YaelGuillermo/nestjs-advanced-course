// src/database/ensure-database-schemas.ts
import { Logger } from '@nestjs/common';
import type { DataSourceOptions } from 'typeorm';
import { DataSource } from 'typeorm';
import type { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import {
  buildRequiredDatabaseSchemas,
  normalizeDatabaseSchemas,
} from './database.schemas';
import { quotePostgresSchema } from './postgres-identifiers';
import { assertPostgresDataSourceOptions } from './typeorm.config';

const logger = new Logger('DatabaseSchemaBootstrap');

type EnsureDatabaseSchemasOptions = {
  schemas?: string[];
  log?: boolean;
};

function createSchemaBootstrapDataSourceOptions(
  options: PostgresConnectionOptions,
): DataSourceOptions {
  return {
    ...options,
    synchronize: false,
    dropSchema: false,
    migrationsRun: false,
    entities: [],
    migrations: [],
    subscribers: [],
  };
}

export async function ensureDatabaseSchemas(
  options: DataSourceOptions,
  params: EnsureDatabaseSchemasOptions = {},
): Promise<string[]> {
  assertPostgresDataSourceOptions(options);

  const schemas = normalizeDatabaseSchemas(
    params.schemas ?? buildRequiredDatabaseSchemas(options.schema),
  );

  if (!schemas.length) {
    return [];
  }

  const dataSource = new DataSource(
    createSchemaBootstrapDataSourceOptions(options),
  );

  try {
    await dataSource.initialize();

    for (const schema of schemas) {
      await dataSource.query(
        `CREATE SCHEMA IF NOT EXISTS ${quotePostgresSchema(schema)}`,
      );

      if (params.log !== false) {
        logger.log(`Database schema "${schema}" is ready.`);
      }
    }

    return schemas;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}
