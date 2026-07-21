// test/support/env/load-test-env.ts
import { config as loadDotenv } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

const TEST_ENV_FILE = 'env/.env.test';

let loaded = false;

function loadIfExists(path: string): void {
  if (!existsSync(path)) {
    throw new Error(`Missing test env file: ${path}`);
  }

  loadDotenv({
    path,
    override: true,
    quiet: true,
  });
}

export function loadTestEnv(): void {
  if (loaded) {
    return;
  }

  const root = process.cwd();

  process.env.DOTENV_CONFIG_QUIET = 'true';
  process.env.NODE_ENV = 'test';

  loadIfExists(resolve(root, TEST_ENV_FILE));

  /**
   * Important:
   * We load env/.env.test manually, then ask Nest ConfigModule not to load
   * env files again. This avoids duplicated dotenv logs and prevents
   * env/.env.development from leaking into test runtime.
   */
  process.env.NODE_ENV = 'test';
  process.env.CONFIG_IGNORE_ENV_FILE = 'true';

  loaded = true;
}
