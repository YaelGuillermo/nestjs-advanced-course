// src/database/scripts/migrate.ts
import dataSource, { ensureCliDatabaseSchemas } from '../data-source';

const VALID_COMMANDS = ['run', 'revert', 'show'] as const;
type MigrationCommand = (typeof VALID_COMMANDS)[number];

function parseCommand(): MigrationCommand {
  const command = process.argv[2] as MigrationCommand | undefined;

  if (!command || !VALID_COMMANDS.includes(command)) {
    throw new Error(
      `Invalid migration command. Use one of: ${VALID_COMMANDS.join(', ')}.`,
    );
  }

  return command;
}

async function bootstrap(): Promise<void> {
  const command = parseCommand();

  await ensureCliDatabaseSchemas();
  await dataSource.initialize();

  try {
    if (command === 'run') {
      const migrations = await dataSource.runMigrations({ transaction: 'all' });
      console.log(`[database] Executed ${migrations.length} migration(s).`);
      return;
    }

    if (command === 'revert') {
      await dataSource.undoLastMigration({ transaction: 'all' });
      console.log('[database] Reverted last migration.');
      return;
    }

    const hasPendingMigrations = await dataSource.showMigrations();
    console.log(
      hasPendingMigrations
        ? '[database] There are pending migrations.'
        : '[database] No pending migrations.',
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
