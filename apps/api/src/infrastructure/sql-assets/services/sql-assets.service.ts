// src/infrastructure/sql-assets/sql-assets.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { syncSqlAssets } from '../sync-sql-assets';
import type {
  SqlAssetDefinition,
  SqlAssetSyncOptions,
  SqlAssetSyncResult,
} from '../types/sql-asset.types';

type SqlAssetsManifestModule = {
  SQL_ASSETS_MANIFEST?: SqlAssetDefinition[];
  default?: SqlAssetDefinition[];
};

async function importManifest(): Promise<SqlAssetDefinition[]> {
  try {
    const dynamicImport = new Function(
      'modulePath',
      'return import(modulePath)',
    ) as (modulePath: string) => Promise<SqlAssetsManifestModule>;
    const manifestModule = await dynamicImport('src/sql/sql-assets.manifest');

    return manifestModule.SQL_ASSETS_MANIFEST ?? manifestModule.default ?? [];
  } catch {
    return [];
  }
}

@Injectable()
export class SqlAssetsService {
  private readonly logger = new Logger(SqlAssetsService.name);

  constructor(private readonly dataSource: DataSource) {}

  async sync(
    assets?: SqlAssetDefinition[],
    options: SqlAssetSyncOptions = {},
  ): Promise<SqlAssetSyncResult[]> {
    const sqlAssets = assets ?? (await importManifest());

    if (!sqlAssets.length) {
      this.logger.log('No SQL assets found to sync.');
      return [];
    }

    const results = await syncSqlAssets(this.dataSource, sqlAssets, options);
    const changed = results.filter(
      (result) => result.status === 'created' || result.status === 'updated',
    );

    this.logger.log(
      `SQL assets synced. Total=${results.length}; changed=${changed.length}.`,
    );

    return results;
  }
}
