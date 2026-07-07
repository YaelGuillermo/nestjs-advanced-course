// src/infrastructure/sql-assets/sql-assets.module.ts
import { Global, Module } from '@nestjs/common';
import { SqlAssetsService } from './services/sql-assets.service';

@Global()
@Module({
  providers: [SqlAssetsService],
  exports: [SqlAssetsService],
})
export class SqlAssetsModule {}
