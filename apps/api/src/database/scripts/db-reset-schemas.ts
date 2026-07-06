// src/database/scripts/db-reset-schemas.ts
import { DataSource } from 'typeorm';
import { loadDatabaseConfigForCli } from '../database-cli.config';
import { buildRequiredDatabaseSchemas } from '../database.schemas';
import { ensureDatabaseSchemas } from '../ensure-database-schemas';
import { resetDatabaseSchemas } from '../table-maintenance';
import { buildPostgresDataSourceOptions } from '../typeorm.config';
import {
  hasFlag,
  logScriptResult,
  parseSchemasFlag,
  requireForce,
} from './script-utils';

async function bootstrap(): Promise<void> {
  requireForce('This command drops and recreates application schemas.');

  const database = loadDatabaseConfigForCli();
  const schemas =
    parseSchemasFlag() ?? buildRequiredDatabaseSchemas(database.schema);
  const dataSourceOptions = buildPostgresDataSourceOptions(database, {
    includeEntities: false,
    includeMigrations: false,
  });

  await ensureDatabaseSchemas(dataSourceOptions, { schemas });

  const dataSource = new DataSource(dataSourceOptions);

  try {
    await dataSource.initialize();

    const resetSchemas = await resetDatabaseSchemas(dataSource, database, {
      schemas,
      includePublicSchema: hasFlag('--include-public'),
    });

    logScriptResult(
      resetSchemas.length
        ? `Reset schemas: ${resetSchemas.join(', ')}.`
        : 'No schemas were reset.',
    );
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

void bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
