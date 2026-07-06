// src/database/scripts/script-utils.ts
export function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

export function getFlagValue(flag: string): string | null {
  const index = process.argv.indexOf(flag);

  if (index === -1) {
    return null;
  }

  return process.argv[index + 1] ?? null;
}

export function requireForce(message: string): void {
  if (!hasFlag('--force')) {
    throw new Error(`${message}\nRe-run with --force if you are sure.`);
  }
}

export function logScriptResult(message: string): void {
  console.log(`[database] ${message}`);
}

export function parseSchemasFlag(): string[] | undefined {
  const value = getFlagValue('--schemas') ?? getFlagValue('--schema');

  if (!value) {
    return undefined;
  }

  return value
    .split(',')
    .map((schema) => schema.trim())
    .filter(Boolean);
}
