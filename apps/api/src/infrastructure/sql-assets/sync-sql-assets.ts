// src/infrastructure/sql-assets/sync-sql-assets.ts
import type { DataSource, QueryRunner } from 'typeorm';
import { hashSql, readSqlFile } from './read-sql';
import type {
  SqlAssetDefinition,
  SqlAssetSyncOptions,
  SqlAssetSyncResult,
} from './types/sql-asset.types';

const REGISTRY_TABLE_NAME = 'sql_assets_registry';

function sortAssets(assets: SqlAssetDefinition[]): SqlAssetDefinition[] {
  return [...assets].sort((left, right) => {
    const leftOrder = left.order ?? 0;
    const rightOrder = right.order ?? 0;

    if (leftOrder !== rightOrder) return leftOrder - rightOrder;
    return left.key.localeCompare(right.key);
  });
}

function quoteIdentifier(identifier: string): string {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
    throw new Error(`Invalid SQL identifier: ${identifier}`);
  }

  return `"${identifier}"`;
}

async function ensureRegistryTable(
  queryRunner: QueryRunner,
  schema: string,
): Promise<void> {
  await queryRunner.query(
    `CREATE SCHEMA IF NOT EXISTS ${quoteIdentifier(schema)}`,
  );
  await queryRunner.query(`
    CREATE TABLE IF NOT EXISTS ${quoteIdentifier(schema)}.${quoteIdentifier(REGISTRY_TABLE_NAME)} (
      key text PRIMARY KEY,
      path text NOT NULL,
      kind text NOT NULL,
      checksum_sha256 text NOT NULL,
      synced_at timestamptz NOT NULL DEFAULT now()
    )
  `);
}

async function findRegisteredChecksum(
  queryRunner: QueryRunner,
  schema: string,
  key: string,
): Promise<string | null> {
  const rows = await queryRunner.query(
    `SELECT checksum_sha256 FROM ${quoteIdentifier(schema)}.${quoteIdentifier(REGISTRY_TABLE_NAME)} WHERE key = $1 LIMIT 1`,
    [key],
  );

  return rows?.[0]?.checksum_sha256 ?? null;
}

async function upsertRegistry(
  queryRunner: QueryRunner,
  schema: string,
  asset: SqlAssetDefinition,
  checksumSha256: string,
): Promise<void> {
  await queryRunner.query(
    `
      INSERT INTO ${quoteIdentifier(schema)}.${quoteIdentifier(REGISTRY_TABLE_NAME)}
        (key, path, kind, checksum_sha256, synced_at)
      VALUES ($1, $2, $3, $4, now())
      ON CONFLICT (key)
      DO UPDATE SET
        path = EXCLUDED.path,
        kind = EXCLUDED.kind,
        checksum_sha256 = EXCLUDED.checksum_sha256,
        synced_at = now()
    `,
    [asset.key, asset.path, asset.kind, checksumSha256],
  );
}

export async function syncSqlAssets(
  dataSource: DataSource,
  assets: SqlAssetDefinition[],
  options: SqlAssetSyncOptions = {},
): Promise<SqlAssetSyncResult[]> {
  const queryRunner = dataSource.createQueryRunner();
  const results: SqlAssetSyncResult[] = [];
  const registrySchema =
    dataSource.options.type === 'postgres' && 'schema' in dataSource.options
      ? String(dataSource.options.schema ?? 'public')
      : 'public';

  await queryRunner.connect();

  try {
    await ensureRegistryTable(queryRunner, registrySchema);

    for (const asset of sortAssets(assets)) {
      if (asset.enabled === false && !options.includeDisabled) {
        const sql = await readSqlFile(asset.path);
        results.push({
          key: asset.key,
          path: asset.path,
          kind: asset.kind,
          status: 'skipped',
          checksumSha256: hashSql(sql),
        });
        continue;
      }

      const sql = await readSqlFile(asset.path);
      const checksumSha256 = hashSql(sql);
      const registeredChecksum = await findRegisteredChecksum(
        queryRunner,
        registrySchema,
        asset.key,
      );
      const shouldRun = options.force || registeredChecksum !== checksumSha256;

      if (!shouldRun) {
        results.push({
          key: asset.key,
          path: asset.path,
          kind: asset.kind,
          status: 'unchanged',
          checksumSha256,
        });
        continue;
      }

      if (options.dryRun) {
        results.push({
          key: asset.key,
          path: asset.path,
          kind: asset.kind,
          status: 'dry-run',
          checksumSha256,
        });
        continue;
      }

      if (asset.transactional !== false) {
        await queryRunner.startTransaction();
      }

      try {
        await queryRunner.query(sql);
        await upsertRegistry(
          queryRunner,
          registrySchema,
          asset,
          checksumSha256,
        );

        if (asset.transactional !== false) {
          await queryRunner.commitTransaction();
        }

        results.push({
          key: asset.key,
          path: asset.path,
          kind: asset.kind,
          status: registeredChecksum ? 'updated' : 'created',
          checksumSha256,
        });
      } catch (error) {
        if (asset.transactional !== false && queryRunner.isTransactionActive) {
          await queryRunner.rollbackTransaction();
        }

        throw error;
      }
    }

    return results;
  } finally {
    await queryRunner.release();
  }
}
