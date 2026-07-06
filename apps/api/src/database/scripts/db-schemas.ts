// src/database/scripts/db-schemas.ts
import { ensureConfiguredDatabaseSchemas } from '../database-admin';
import { loadDatabaseConfigForCli } from '../database-cli.config';
import { logScriptResult } from './script-utils';

async function bootstrap(): Promise<void> {
  const database = loadDatabaseConfigForCli();
  const schemas = await ensureConfiguredDatabaseSchemas(database);

  logScriptResult(`Schemas ready: ${schemas.join(', ')}.`);
}

void bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
