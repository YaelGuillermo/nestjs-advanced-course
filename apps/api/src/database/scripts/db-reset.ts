// src/database/scripts/db-reset.ts
import {
  createDatabaseIfMissing,
  dropDatabaseIfExists,
  ensureConfiguredDatabaseSchemas,
} from '../database-admin';
import { loadDatabaseConfigForCli } from '../database-cli.config';
import { logScriptResult, requireForce } from './script-utils';

async function bootstrap(): Promise<void> {
  requireForce('This command drops and recreates the configured database.');

  const database = loadDatabaseConfigForCli();

  await dropDatabaseIfExists(database);
  await createDatabaseIfMissing(database);

  const schemas = await ensureConfiguredDatabaseSchemas(database);

  logScriptResult(`Database "${database.name}" reset.`);
  logScriptResult(`Schemas ready: ${schemas.join(', ')}.`);
}

void bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
