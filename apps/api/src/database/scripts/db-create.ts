// src/database/scripts/db-create.ts
import {
  createDatabaseIfMissing,
  ensureConfiguredDatabaseSchemas,
} from '../database-admin';
import { loadDatabaseConfigForCli } from '../database-cli.config';
import { logScriptResult } from './script-utils';

async function bootstrap(): Promise<void> {
  const database = loadDatabaseConfigForCli();
  const created = await createDatabaseIfMissing(database);
  const schemas = await ensureConfiguredDatabaseSchemas(database);

  logScriptResult(
    created
      ? `Database "${database.name}" created.`
      : `Database "${database.name}" already exists.`,
  );
  logScriptResult(`Schemas ready: ${schemas.join(', ')}.`);
}

void bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
