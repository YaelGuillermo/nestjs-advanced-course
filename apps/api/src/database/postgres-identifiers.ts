// src/database/postgres-identifiers.ts
import { normalizeDatabaseSchema } from './database.schemas';

export function quotePostgresIdentifier(identifier: string): string {
  const value = String(identifier ?? '').trim();

  if (!value) {
    throw new Error('Postgres identifier cannot be empty.');
  }

  return `"${value.replaceAll('"', '""')}"`;
}

export function quotePostgresSchema(schema: string): string {
  return quotePostgresIdentifier(normalizeDatabaseSchema(schema));
}

export function quotePostgresQualifiedName(
  schema: string,
  tableName: string,
): string {
  return `${quotePostgresSchema(schema)}.${quotePostgresIdentifier(tableName)}`;
}
