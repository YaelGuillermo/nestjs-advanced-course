// src/config/config.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ConfigService } from './config.service';
import {
  resolveEnvFilePaths,
  resolveRuntimeNodeEnv,
  shouldIgnoreEnvFile,
} from './env/env-files';
import { validateEnv } from './env/env.validation';
import apiConfig from './loaders/api.config';
import appConfig from './loaders/app.config';
import authConfig from './loaders/auth.config';
import behaviorConfig from './loaders/behavior.config';
import databaseConfig from './loaders/database.config';
import developmentConfig from './loaders/development.config';
import emailConfig from './loaders/email.config';
import featuresConfig from './loaders/features.config';
import integrationsConfig from './loaders/integrations.config';
import observabilityConfig from './loaders/observability.config';
import paginationConfig from './loaders/pagination.config';
import queueConfig from './loaders/queue.config';
import redisConfig from './loaders/redis.config';
import securityConfig from './loaders/security.config';
import storageConfig from './loaders/storage.config';

const nodeEnv = resolveRuntimeNodeEnv();

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolveEnvFilePaths(nodeEnv),
      ignoreEnvFile: shouldIgnoreEnvFile(),
      load: [
        appConfig,
        apiConfig,
        paginationConfig,
        authConfig,
        securityConfig,
        databaseConfig,
        redisConfig,
        queueConfig,
        emailConfig,
        storageConfig,
        observabilityConfig,
        featuresConfig,
        integrationsConfig,
        behaviorConfig,
        developmentConfig,
      ],
      validate: validateEnv,
      cache: true,
      expandVariables: true,
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
