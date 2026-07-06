// src/database/scripts/db-fresh.ts
import { existsSync } from 'fs';
import { readdir, rm } from 'fs/promises';
import { join } from 'path';
import { stdin as input, stdout as output } from 'process';
import { createInterface } from 'readline/promises';

type ScriptCommand = {
  label: string;
  command: string;
};

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function isProductionEnv(): boolean {
  return process.env.NODE_ENV === 'production';
}

async function confirmFreshDatabase(): Promise<void> {
  if (hasFlag('--force')) {
    return;
  }

  const readline = createInterface({ input, output });

  try {
    console.log('');
    console.log('⚠️  This will completely reset your development database.');
    console.log(
      'It will drop the database, recreate it, regenerate InitialSchema, and run migrations.',
    );
    console.log('');

    const answer = await readline.question(
      'Type "yes" to continue, or anything else to cancel: ',
    );

    if (answer.trim().toLowerCase() !== 'yes') {
      console.log('Cancelled.');
      process.exit(0);
    }
  } finally {
    readline.close();
  }
}

async function removeInitialSchemaMigrations(): Promise<void> {
  const migrationsDir = join(process.cwd(), 'src/database/migrations');

  if (!existsSync(migrationsDir)) {
    return;
  }

  const files = await readdir(migrationsDir);
  const initialSchemaFiles = files.filter(
    (file) => file.endsWith('.ts') && file.includes('InitialSchema'),
  );

  for (const file of initialSchemaFiles) {
    const filePath = join(migrationsDir, file);
    await rm(filePath, { force: true });
    console.log(`[database] Removed migration: ${file}`);
  }
}

async function runCommand(command: ScriptCommand): Promise<void> {
  const { execa } = await import('execa');

  console.log('');
  console.log(`[database] ${command.label}`);

  await execa(command.command, {
    shell: true,
    stdio: 'inherit',
    env: {
      ...process.env,
    },
  });
}

async function bootstrap(): Promise<void> {
  if (isProductionEnv() && !hasFlag('--allow-production')) {
    throw new Error(
      'Refusing to run db:fresh in production. Pass --allow-production only if you really know what you are doing.',
    );
  }

  await confirmFreshDatabase();
  await removeInitialSchemaMigrations();

  const commands: ScriptCommand[] = [
    {
      label: 'Dropping database...',
      command: 'pnpm db:drop',
    },
    {
      label: 'Creating database...',
      command: 'pnpm db:create',
    },
    {
      label: 'Ensuring schemas...',
      command: 'pnpm db:schemas',
    },
    {
      label: 'Generating InitialSchema migration...',
      command: 'pnpm db:migration:generate',
    },
    {
      label: 'Running migrations...',
      command: 'pnpm db:migrate',
    },
  ];

  for (const command of commands) {
    await runCommand(command);
  }

  console.log('');
  console.log('[database] Fresh database is ready.');
}

void bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
