// src/database/database-admin.ts
import type { DatabaseConfig } from 'src/config/types/config.types';
import { DataSource } from 'typeorm';
import { buildRequiredDatabaseSchemas } from './database.schemas';
import { ensureDatabaseSchemas } from './ensure-database-schemas';
import { quotePostgresIdentifier } from './postgres-identifiers';
import {
  buildPostgresAdminDataSourceOptions,
  buildPostgresDataSourceOptions,
} from './typeorm.config';

async function withAdminDataSource<T>(
  database: DatabaseConfig,
  callback: (dataSource: DataSource) => Promise<T>,
): Promise<T> {
  const dataSource = new DataSource(
    buildPostgresAdminDataSourceOptions(database),
  );

  try {
    await dataSource.initialize();
    return await callback(dataSource);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

export async function databaseExists(
  database: DatabaseConfig,
): Promise<boolean> {
  return withAdminDataSource(database, async (dataSource) => {
    const rows = (await dataSource.query(
      'SELECT 1 FROM pg_database WHERE datname = $1 LIMIT 1',
      [database.name],
    )) as unknown[];

    return rows.length > 0;
  });
}

export async function terminateDatabaseConnections(
  database: DatabaseConfig,
): Promise<void> {
  await withAdminDataSource(database, async (dataSource) => {
    await dataSource.query(
      `SELECT pg_terminate_backend(pid)
       FROM pg_stat_activity
       WHERE datname = $1
         AND pid <> pg_backend_pid()`,
      [database.name],
    );
  });
}

export async function createDatabaseIfMissing(
  database: DatabaseConfig,
): Promise<boolean> {
  return withAdminDataSource(database, async (dataSource) => {
    const rows = (await dataSource.query(
      'SELECT 1 FROM pg_database WHERE datname = $1 LIMIT 1',
      [database.name],
    )) as unknown[];

    if (rows.length > 0) {
      return false;
    }

    await dataSource.query(
      `CREATE DATABASE ${quotePostgresIdentifier(database.name)}`,
    );

    return true;
  });
}

export async function dropDatabaseIfExists(
  database: DatabaseConfig,
): Promise<boolean> {
  await terminateDatabaseConnections(database);

  return withAdminDataSource(database, async (dataSource) => {
    const rows = (await dataSource.query(
      'SELECT 1 FROM pg_database WHERE datname = $1 LIMIT 1',
      [database.name],
    )) as unknown[];

    if (rows.length === 0) {
      return false;
    }

    await dataSource.query(
      `DROP DATABASE ${quotePostgresIdentifier(database.name)}`,
    );

    return true;
  });
}

export async function ensureConfiguredDatabaseSchemas(
  database: DatabaseConfig,
): Promise<string[]> {
  const options = buildPostgresDataSourceOptions(database, {
    includeEntities: false,
    includeMigrations: false,
  });

  return ensureDatabaseSchemas(options, {
    schemas: buildRequiredDatabaseSchemas(database.schema),
  });
}
