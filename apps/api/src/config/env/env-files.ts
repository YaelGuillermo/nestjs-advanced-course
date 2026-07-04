// src/config/env/env-files.ts
import { config as loadDotenv } from 'dotenv';

export const ENV_DIRECTORY = 'env' as const;
export const DEFAULT_NODE_ENV = 'development' as const;

export function resolveRuntimeNodeEnv(): string {
  return (process.env.NODE_ENV ?? DEFAULT_NODE_ENV).trim() || DEFAULT_NODE_ENV;
}

export function shouldIgnoreEnvFile(): boolean {
  return process.env.CONFIG_IGNORE_ENV_FILE === 'true';
}

export function resolveEnvFilePaths(
  nodeEnv = resolveRuntimeNodeEnv(),
): string[] {
  return [`${ENV_DIRECTORY}/.env.${nodeEnv}`];
}

export function loadEnvFilesForCli(): void {
  if (shouldIgnoreEnvFile()) {
    return;
  }

  for (const envFilePath of resolveEnvFilePaths()) {
    loadDotenv({
      path: envFilePath,
      override: false,
    });
  }
}
