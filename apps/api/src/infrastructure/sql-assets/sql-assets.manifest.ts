// src/sql/sql-assets.manifest.ts
import type { SqlAssetDefinition } from 'src/infrastructure/sql-assets/types/sql-asset.types';

export const SQL_ASSETS_MANIFEST: SqlAssetDefinition[] = [
  {
    key: 'users.live-programs-count',
    kind: 'function',
    path: 'src/modules/accounts/users/sql/functions/users_live_programs_count.sql',
    schema: 'public',
    name: 'users_live_programs_count',
    order: 100,
  },
  {
    key: 'programs.idx-programs-user-id-live',
    kind: 'index',
    path: 'src/modules/accounts/users/sql/indexes/idx_programs_user_id_live.sql',
    schema: 'public',
    name: 'idx_programs_user_id_live',
    order: 200,
    transactional: false,
  },
];

export default SQL_ASSETS_MANIFEST;
