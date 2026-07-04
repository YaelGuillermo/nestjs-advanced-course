// src/config/env/env.parsers.ts
export class EnvParseError extends Error {
  constructor(variableName: string, message: string) {
    super(`${variableName}: ${message}`);
    this.name = 'EnvParseError';
  }
}

function isMissing(value: unknown): value is undefined | null {
  return value === undefined || value === null;
}

function isBlankString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length === 0;
}

function normalizeValue(value: unknown): string | undefined {
  if (isMissing(value)) return undefined;
  if (isBlankString(value)) return undefined;
  return String(value).trim();
}

export function parseBoolean(
  value: unknown,
  variableName = 'ENV_BOOLEAN',
): boolean | undefined {
  if (typeof value === 'boolean') return value;

  const normalized = normalizeValue(value);
  if (normalized === undefined) return undefined;

  const lowered = normalized.toLowerCase();
  if (['true', '1', 'yes', 'y', 'on'].includes(lowered)) return true;
  if (['false', '0', 'no', 'n', 'off'].includes(lowered)) return false;

  throw new EnvParseError(
    variableName,
    `expected a boolean value: true, false, 1, 0, yes, no, on, off. Received "${normalized}".`,
  );
}

export function parseInteger(
  value: unknown,
  variableName = 'ENV_INTEGER',
): number | undefined {
  if (typeof value === 'number' && Number.isInteger(value)) return value;

  const normalized = normalizeValue(value);
  if (normalized === undefined) return undefined;

  if (!/^[+-]?\d+$/.test(normalized)) {
    throw new EnvParseError(
      variableName,
      `expected an integer. Received "${normalized}".`,
    );
  }

  const parsed = Number(normalized);
  if (!Number.isSafeInteger(parsed)) {
    throw new EnvParseError(
      variableName,
      `expected a safe integer. Received "${normalized}".`,
    );
  }

  return parsed;
}

export function parseFloatNumber(
  value: unknown,
  variableName = 'ENV_FLOAT',
): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;

  const normalized = normalizeValue(value);
  if (normalized === undefined) return undefined;

  if (!/^[+-]?(?:\d+|\d*\.\d+)$/.test(normalized)) {
    throw new EnvParseError(
      variableName,
      `expected a finite number. Received "${normalized}".`,
    );
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    throw new EnvParseError(
      variableName,
      `expected a finite number. Received "${normalized}".`,
    );
  }

  return parsed;
}

export function parseCsv(
  value: unknown,
  variableName = 'ENV_CSV',
): string[] | undefined {
  if (Array.isArray(value)) {
    const items = value
      .map(String)
      .map((item) => item.trim())
      .filter(Boolean);
    return items.length > 0 ? items : undefined;
  }

  const normalized = normalizeValue(value);
  if (normalized === undefined) return undefined;

  const items = normalized
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (items.length === 0) {
    throw new EnvParseError(variableName, 'expected at least one CSV item.');
  }

  return items;
}

export function parseOptionalString(value: unknown): string | undefined {
  const normalized = normalizeValue(value);
  return normalized;
}
