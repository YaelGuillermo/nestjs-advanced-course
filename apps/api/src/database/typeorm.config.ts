// src/database/typeorm.config.ts
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';
import { ConfigService } from 'src/config/config.service';
import type { DatabaseConfig } from 'src/config/types/config.types';
import type { DataSourceOptions } from 'typeorm';
import type { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export type AppPostgresDataSourceOptions = PostgresConnectionOptions;

export const TYPEORM_MIGRATIONS_TABLE_NAME = 'typeorm_migrations' as const;

type RuntimeMode = 'auto' | 'source' | 'compiled';

type BuildTypeOrmOptionsParams = {
  includeEntities?: boolean;
  includeMigrations?: boolean;
  runtimeMode?: RuntimeMode;
  databaseName?: string;
};

function isCompiledRuntime(): boolean {
  return __filename.endsWith('.js');
}

function resolveRuntimeMode(
  mode: RuntimeMode = 'auto',
): Exclude<RuntimeMode, 'auto'> {
  if (mode === 'source' || mode === 'compiled') {
    return mode;
  }

  return isCompiledRuntime() ? 'compiled' : 'source';
}

export function getEntitiesGlob(mode: RuntimeMode = 'auto'): string {
  return resolveRuntimeMode(mode) === 'compiled'
    ? join(process.cwd(), 'dist/**/*.entity.js')
    : join(process.cwd(), 'src/**/*.entity.ts');
}

export function getMigrationsGlob(mode: RuntimeMode = 'auto'): string {
  return resolveRuntimeMode(mode) === 'compiled'
    ? join(process.cwd(), 'dist/database/migrations/*.js')
    : join(process.cwd(), 'src/database/migrations/*.ts');
}

export function buildPostgresDataSourceOptions(
  database: DatabaseConfig,
  params: BuildTypeOrmOptionsParams = {},
): AppPostgresDataSourceOptions {
  const includeEntities = params.includeEntities ?? false;
  const includeMigrations = params.includeMigrations ?? true;

  return {
    type: 'postgres',
    host: database.host,
    port: database.port,
    username: database.username,
    password: database.password,
    database: params.databaseName ?? database.name,
    schema: database.schema,

    synchronize: database.synchronize,
    dropSchema: database.dropSchema,
    logging: database.logging,
    migrationsRun: database.runMigrations,
    migrationsTableName: TYPEORM_MIGRATIONS_TABLE_NAME,

    entities: includeEntities ? [getEntitiesGlob(params.runtimeMode)] : [],
    migrations: includeMigrations
      ? [getMigrationsGlob(params.runtimeMode)]
      : [],

    ssl: database.ssl
      ? {
          rejectUnauthorized: false,
        }
      : false,

    extra: {
      max: database.maxConnections,
      idleTimeoutMillis: database.idleTimeoutMs,
      connectionTimeoutMillis: database.connectionTimeoutMs,
    },
  };
}

export function buildPostgresAdminDataSourceOptions(
  database: DatabaseConfig,
): AppPostgresDataSourceOptions {
  return {
    ...buildPostgresDataSourceOptions(database, {
      databaseName: database.adminDatabase,
      includeEntities: false,
      includeMigrations: false,
    }),
    schema: undefined,
    synchronize: false,
    dropSchema: false,
    migrationsRun: false,
    entities: [],
    migrations: [],
    subscribers: [],
  };
}

export function typeOrmDataSourceOptions(
  configService: ConfigService,
): AppPostgresDataSourceOptions {
  return buildPostgresDataSourceOptions(configService.database, {
    includeEntities: false,
    includeMigrations: true,
  });
}

export function typeOrmCliDataSourceOptions(
  database: DatabaseConfig,
): AppPostgresDataSourceOptions {
  return buildPostgresDataSourceOptions(database, {
    includeEntities: true,
    includeMigrations: true,
  });
}

export function typeOrmModuleOptions(
  configService: ConfigService,
): TypeOrmModuleOptions {
  const dataSourceOptions = typeOrmDataSourceOptions(configService);

  return {
    ...dataSourceOptions,
    autoLoadEntities: true,
  };
}

export function assertPostgresDataSourceOptions(
  options: DataSourceOptions,
): asserts options is PostgresConnectionOptions {
  if (options.type !== 'postgres') {
    throw new Error(
      `Invalid database driver "${options.type}". This application expects "postgres".`,
    );
  }
}
