// src/database/database.schemas.ts
export const DEFAULT_DATABASE_SCHEMA = 'public' as const;

export const APPLICATION_DATABASE_SCHEMAS = ['accounts', 'threads'] as const;

export type ApplicationDatabaseSchema =
  | typeof DEFAULT_DATABASE_SCHEMA
  | (typeof APPLICATION_DATABASE_SCHEMAS)[number];

export function normalizeDatabaseSchema(schema?: string | null): string {
  const normalized = String(schema || DEFAULT_DATABASE_SCHEMA).trim();

  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(normalized)) {
    throw new Error(`Invalid database schema name: ${schema}`);
  }

  return normalized;
}

export function normalizeDatabaseSchemas(
  schemas: Array<string | null | undefined>,
): string[] {
  return Array.from(
    new Set(schemas.map(normalizeDatabaseSchema).filter(Boolean)),
  );
}

export function buildRequiredDatabaseSchemas(
  primarySchema?: string | null,
  extraSchemas: readonly string[] = APPLICATION_DATABASE_SCHEMAS,
): string[] {
  return normalizeDatabaseSchemas([primarySchema, ...extraSchemas]);
}

export function isPublicSchema(schema: string): boolean {
  return normalizeDatabaseSchema(schema) === DEFAULT_DATABASE_SCHEMA;
}
