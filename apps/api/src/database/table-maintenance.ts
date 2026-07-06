// src/database/table-maintenance.ts
import type { DatabaseConfig } from 'src/config/types/config.types';
import { DataSource } from 'typeorm';
import {
  buildRequiredDatabaseSchemas,
  normalizeDatabaseSchemas,
} from './database.schemas';
import {
  quotePostgresQualifiedName,
  quotePostgresSchema,
} from './postgres-identifiers';
import { TYPEORM_MIGRATIONS_TABLE_NAME } from './typeorm.config';

export type DatabaseTableReference = {
  schema: string;
  tableName: string;
};

export type TruncateDatabaseTablesOptions = {
  schemas?: string[];
  includeMigrationsTable?: boolean;
};

export type ResetDatabaseSchemasOptions = {
  schemas?: string[];
  includePublicSchema?: boolean;
};

export async function listDatabaseTables(
  dataSource: DataSource,
  schemas: string[],
): Promise<DatabaseTableReference[]> {
  const normalizedSchemas = normalizeDatabaseSchemas(schemas);

  if (!normalizedSchemas.length) {
    return [];
  }

  const rows = (await dataSource.query(
    `SELECT table_schema AS "schema", table_name AS "tableName"
     FROM information_schema.tables
     WHERE table_type = 'BASE TABLE'
       AND table_schema = ANY($1)
     ORDER BY table_schema ASC, table_name ASC`,
    [normalizedSchemas],
  )) as DatabaseTableReference[];

  return rows;
}

export async function truncateDatabaseTables(
  dataSource: DataSource,
  database: DatabaseConfig,
  options: TruncateDatabaseTablesOptions = {},
): Promise<DatabaseTableReference[]> {
  const schemas = normalizeDatabaseSchemas(
    options.schemas ?? buildRequiredDatabaseSchemas(database.schema),
  );

  const tables = (await listDatabaseTables(dataSource, schemas)).filter(
    (table) =>
      options.includeMigrationsTable === true ||
      table.tableName !== TYPEORM_MIGRATIONS_TABLE_NAME,
  );

  if (!tables.length) {
    return [];
  }

  const qualifiedTables = tables
    .map((table) => quotePostgresQualifiedName(table.schema, table.tableName))
    .join(', ');

  await dataSource.query(
    `TRUNCATE TABLE ${qualifiedTables} RESTART IDENTITY CASCADE`,
  );

  return tables;
}

export async function resetDatabaseSchemas(
  dataSource: DataSource,
  database: DatabaseConfig,
  options: ResetDatabaseSchemasOptions = {},
): Promise<string[]> {
  const schemas = normalizeDatabaseSchemas(
    options.schemas ?? buildRequiredDatabaseSchemas(database.schema),
  ).filter(
    (schema) => options.includePublicSchema === true || schema !== 'public',
  );

  for (const schema of schemas) {
    await dataSource.query(
      `DROP SCHEMA IF EXISTS ${quotePostgresSchema(schema)} CASCADE`,
    );
    await dataSource.query(
      `CREATE SCHEMA IF NOT EXISTS ${quotePostgresSchema(schema)}`,
    );
  }

  return schemas;
}
