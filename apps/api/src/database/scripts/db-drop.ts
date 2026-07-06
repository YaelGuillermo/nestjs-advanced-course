// src/database/scripts/db-drop.ts
import { dropDatabaseIfExists } from '../database-admin';
import { loadDatabaseConfigForCli } from '../database-cli.config';
import { logScriptResult, requireForce } from './script-utils';

async function bootstrap(): Promise<void> {
  requireForce('This command drops the configured database.');

  const database = loadDatabaseConfigForCli();
  const dropped = await dropDatabaseIfExists(database);

  logScriptResult(
    dropped
      ? `Database "${database.name}" dropped.`
      : `Database "${database.name}" did not exist.`,
  );
}

void bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
