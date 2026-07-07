// src/infrastructure/sql-assets/read-sql.ts
import { createHash } from 'crypto';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { isAbsolute, join } from 'path';

export function normalizeSqlAssetPath(path: string): string {
  return String(path ?? '')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '');
}

export function resolveSqlAssetPath(path: string): string {
  if (isAbsolute(path)) {
    return path;
  }

  const normalized = normalizeSqlAssetPath(path);
  const candidates = [
    join(process.cwd(), normalized),
    join(process.cwd(), 'src', normalized),
    join(process.cwd(), 'dist', normalized),
  ];

  const match = candidates.find((candidate) => existsSync(candidate));

  if (!match) {
    throw new Error(`SQL asset not found: ${path}`);
  }

  return match;
}

export async function readSqlFile(path: string): Promise<string> {
  const absolutePath = resolveSqlAssetPath(path);
  const sql = await readFile(absolutePath, 'utf8');

  return sql.trim();
}

export function hashSql(sql: string): string {
  return createHash('sha256').update(sql).digest('hex');
}
