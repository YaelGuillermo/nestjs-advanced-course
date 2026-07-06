// src/database/database.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from 'src/config/config.module';
import { ConfigService } from 'src/config/config.service';
import { buildRequiredDatabaseSchemas } from './database.schemas';
import { ensureDatabaseSchemas } from './ensure-database-schemas';
import {
  typeOrmDataSourceOptions,
  typeOrmModuleOptions,
} from './typeorm.config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const dataSourceOptions = typeOrmDataSourceOptions(configService);

        await ensureDatabaseSchemas(dataSourceOptions, {
          schemas: buildRequiredDatabaseSchemas(configService.database.schema),
        });

        return typeOrmModuleOptions(configService);
      },
    }),
  ],
})
export class DatabaseModule {}
