// src/modules/common/sql/read-sql.ts
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

type ReadSqlOptions = {
  encoding?: BufferEncoding;
};

export function readSql(
  relativeFromProject: string,
  opts: ReadSqlOptions = {},
): string {
  const encoding = opts.encoding ?? 'utf8';

  // We support running from TS (src) and from compiled JS (dist).
  const candidates = [
    resolve(process.cwd(), 'src', relativeFromProject),
    resolve(process.cwd(), 'dist', relativeFromProject),
    resolve(process.cwd(), relativeFromProject),
  ];

  for (const fullPath of candidates) {
    if (existsSync(fullPath)) return readFileSync(fullPath, encoding);
  }

  throw new Error(`SQL file not found. Tried:\n- ${candidates.join('\n- ')}`);
}
