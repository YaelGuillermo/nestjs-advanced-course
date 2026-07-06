// src/database/data-source.ts
import { DataSource } from 'typeorm';
import { loadDatabaseConfigForCli } from './database-cli.config';
import { buildRequiredDatabaseSchemas } from './database.schemas';
import { ensureDatabaseSchemas } from './ensure-database-schemas';
import { typeOrmCliDataSourceOptions } from './typeorm.config';

export const databaseConfig = loadDatabaseConfigForCli();

export const dataSourceOptions = typeOrmCliDataSourceOptions(databaseConfig);

export async function ensureCliDatabaseSchemas(): Promise<string[]> {
  return ensureDatabaseSchemas(dataSourceOptions, {
    schemas: buildRequiredDatabaseSchemas(databaseConfig.schema),
  });
}

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
