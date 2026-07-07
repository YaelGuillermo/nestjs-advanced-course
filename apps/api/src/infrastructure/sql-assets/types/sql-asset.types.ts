// src/infrastructure/sql-assets/types/sql-asset.types.ts
export type SqlAssetKind =
  | 'extension'
  | 'function'
  | 'index'
  | 'materialized-view'
  | 'policy'
  | 'procedure'
  | 'trigger'
  | 'view'
  | 'other';

export interface SqlAssetDefinition {
  key: string;
  path: string;
  kind: SqlAssetKind;
  name?: string;
  schema?: string;
  enabled?: boolean;
  order?: number;
  transactional?: boolean;
}

export interface SqlAssetSyncOptions {
  force?: boolean;
  dryRun?: boolean;
  includeDisabled?: boolean;
}

export interface SqlAssetSyncResult {
  key: string;
  path: string;
  kind: SqlAssetKind;
  status: 'created' | 'updated' | 'unchanged' | 'skipped' | 'dry-run';
  checksumSha256: string;
}
