// src/database/scripts/sync-sql-assets.ts
import { syncSqlAssets } from 'src/infrastructure/sql-assets/sync-sql-assets';
import type { SqlAssetDefinition } from 'src/infrastructure/sql-assets/types/sql-asset.types';
import dataSource, { ensureCliDatabaseSchemas } from '../data-source';
import { hasFlag } from './script-utils';

type ManifestModule = {
  SQL_ASSETS_MANIFEST?: SqlAssetDefinition[];
  default?: SqlAssetDefinition[];
};

async function loadManifest(): Promise<SqlAssetDefinition[]> {
  const manifest = (await import(
    'src/infrastructure/sql-assets/sql-assets.manifest'
  )) as ManifestModule;

  return manifest.SQL_ASSETS_MANIFEST ?? manifest.default ?? [];
}

async function bootstrap(): Promise<void> {
  const force = hasFlag('--force');
  const dryRun = hasFlag('--dry-run');
  const assets = await loadManifest();

  await ensureCliDatabaseSchemas();
  await dataSource.initialize();

  try {
    const results = await syncSqlAssets(dataSource, assets, { force, dryRun });
    const changed = results.filter((result) =>
      ['created', 'updated', 'dry-run'].includes(result.status),
    );

    console.log(
      `[database] SQL assets processed. Total=${results.length}; changed=${changed.length}.`,
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
