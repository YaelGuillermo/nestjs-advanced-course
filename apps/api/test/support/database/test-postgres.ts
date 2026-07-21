// test/support/database/test-postgres.ts
import { randomUUID } from 'crypto';
import { Client } from 'pg';
import { buildRequiredDatabaseSchemas } from 'src/database/database.schemas';
import { loadTestEnv } from '../env/load-test-env';

export interface TestPostgresHandle {
  dbName: string;
  stop: () => Promise<void>;
}

type PreviousDbEnv = Partial<
  Pick<
    NodeJS.ProcessEnv,
    | 'DB_NAME'
    | 'DB_SYNCHRONIZE'
    | 'DB_DROP_SCHEMA'
    | 'DB_LOGGING'
    | 'DB_RUN_MIGRATIONS'
    | 'CONFIG_IGNORE_ENV_FILE'
  >
>;

interface AdminConnectionOptions {
  host: string;
  port: number;
  username: string;
  password: string;
  adminDatabase: string;
}

function getAdminConnectionOptions(): AdminConnectionOptions {
  loadTestEnv();

  return {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    adminDatabase: process.env.DB_ADMIN_DATABASE ?? 'postgres',
  };
}

function makeDatabaseName(): string {
  const baseName = process.env.DB_NAME?.trim() || 'chain_test';
  const normalizedBaseName = baseName
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/^([^a-z_])/, '_$1')
    .replace(/_+$/, '');

  const suffix = randomUUID().replace(/-/g, '').slice(0, 20);

  return `${normalizedBaseName}_${suffix}`;
}

function createAdminClient(admin: AdminConnectionOptions): Client {
  return new Client({
    host: admin.host,
    port: admin.port,
    user: admin.username,
    password: admin.password,
    database: admin.adminDatabase,
  });
}

function createDatabaseClient(
  admin: AdminConnectionOptions,
  database: string,
): Client {
  return new Client({
    host: admin.host,
    port: admin.port,
    user: admin.username,
    password: admin.password,
    database,
  });
}

function quoteIdentifier(value: string): string {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
    throw new Error(`Unsafe PostgreSQL identifier: ${value}`);
  }

  return `"${value.replace(/"/g, '""')}"`;
}

async function createDatabase(
  admin: AdminConnectionOptions,
  dbName: string,
): Promise<void> {
  const client = createAdminClient(admin);
  await client.connect();

  try {
    await client.query(`CREATE DATABASE ${quoteIdentifier(dbName)}`);
  } finally {
    await client.end();
  }
}

async function createSchemas(
  admin: AdminConnectionOptions,
  dbName: string,
): Promise<void> {
  const client = createDatabaseClient(admin, dbName);
  await client.connect();

  try {
    const schemas = buildRequiredDatabaseSchemas(
      process.env.DB_SCHEMA ?? 'public',
    );

    for (const schema of schemas) {
      await client.query(
        `CREATE SCHEMA IF NOT EXISTS ${quoteIdentifier(schema)}`,
      );
    }
  } finally {
    await client.end();
  }
}

async function dropDatabase(
  admin: AdminConnectionOptions,
  dbName: string,
): Promise<void> {
  const client = createAdminClient(admin);
  await client.connect();

  try {
    await client.query(
      `
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = $1
        AND pid <> pg_backend_pid()
      `,
      [dbName],
    );

    await client.query(`DROP DATABASE IF EXISTS ${quoteIdentifier(dbName)}`);
  } finally {
    await client.end();
  }
}

export async function startTestPostgres(): Promise<TestPostgresHandle> {
  const admin = getAdminConnectionOptions();
  const dbName = makeDatabaseName();

  const previousEnv: PreviousDbEnv = {
    DB_NAME: process.env.DB_NAME,
    DB_SYNCHRONIZE: process.env.DB_SYNCHRONIZE,
    DB_DROP_SCHEMA: process.env.DB_DROP_SCHEMA,
    DB_LOGGING: process.env.DB_LOGGING,
    DB_RUN_MIGRATIONS: process.env.DB_RUN_MIGRATIONS,
    CONFIG_IGNORE_ENV_FILE: process.env.CONFIG_IGNORE_ENV_FILE,
  };

  await createDatabase(admin, dbName);
  await createSchemas(admin, dbName);

  process.env.DB_NAME = dbName;
  process.env.DB_SYNCHRONIZE = 'true';
  process.env.DB_DROP_SCHEMA = 'false';
  process.env.DB_LOGGING = 'false';
  process.env.DB_RUN_MIGRATIONS = 'false';
  process.env.CONFIG_IGNORE_ENV_FILE = 'true';

  return {
    dbName,
    stop: async () => {
      await dropDatabase(admin, dbName);

      for (const [key, value] of Object.entries(previousEnv)) {
        if (value === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = value;
        }
      }
    },
  };
}
