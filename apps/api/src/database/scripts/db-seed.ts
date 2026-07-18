// src/database/scripts/db-seed.ts
import dataSource, {
  databaseConfig,
  ensureCliDatabaseSchemas,
} from '../data-source';
import { buildRequiredDatabaseSchemas } from '../database.schemas';
import { DevelopmentDataSeeder } from '../seeders/development-data.seeder';
import { createDevelopmentSeedConfigFromArgv } from '../seeders/development-seed.config';
import { truncateDatabaseTables } from '../table-maintenance';
import { hasFlag, logScriptResult, requireForce } from './script-utils';

function assertSafeRuntime(): void {
  if (process.env.NODE_ENV === 'production' && !hasFlag('--allow-production')) {
    throw new Error(
      'Refusing to seed a production database. Pass --allow-production only if you really know what you are doing.',
    );
  }
}

async function bootstrap(): Promise<void> {
  assertSafeRuntime();
  requireForce(
    'This command truncates application data and creates random seed records.',
  );

  const seedConfig = createDevelopmentSeedConfigFromArgv();
  const schemas = buildRequiredDatabaseSchemas(databaseConfig.schema);

  await ensureCliDatabaseSchemas();
  await dataSource.initialize();

  try {
    const truncatedTables = await truncateDatabaseTables(
      dataSource,
      databaseConfig,
      {
        schemas,
        includeMigrationsTable: false,
      },
    );

    logScriptResult(
      truncatedTables.length
        ? `Truncated ${truncatedTables.length} table(s).`
        : 'No application tables were found to truncate.',
    );

    const seeder = new DevelopmentDataSeeder(dataSource, seedConfig);
    const summary = await seeder.seed();

    logScriptResult(`Seed completed with seed=${seedConfig.seed}.`);
    logScriptResult(`Users: ${summary.users}.`);
    logScriptResult(`User avatars: ${summary.userAvatars}.`);
    logScriptResult(`Seed user password: ${summary.seedPassword}`);
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
