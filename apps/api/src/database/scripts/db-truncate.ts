// src/database/scripts/db-truncate.ts
import { DataSource } from 'typeorm';
import { loadDatabaseConfigForCli } from '../database-cli.config';
import { buildRequiredDatabaseSchemas } from '../database.schemas';
import { ensureDatabaseSchemas } from '../ensure-database-schemas';
import { truncateDatabaseTables } from '../table-maintenance';
import { buildPostgresDataSourceOptions } from '../typeorm.config';
import {
  hasFlag,
  logScriptResult,
  parseSchemasFlag,
  requireForce,
} from './script-utils';

async function bootstrap(): Promise<void> {
  requireForce('This command truncates data from database tables.');

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

    const truncatedTables = await truncateDatabaseTables(dataSource, database, {
      schemas,
      includeMigrationsTable: hasFlag('--include-migrations'),
    });

    logScriptResult(
      truncatedTables.length
        ? `Truncated ${truncatedTables.length} table(s).`
        : 'No tables found to truncate.',
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
