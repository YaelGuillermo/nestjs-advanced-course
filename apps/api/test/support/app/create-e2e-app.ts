// test/support/app/create-e2e-app.ts
import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { I18nValidationPipe } from 'nestjs-i18n';
import {
  configureBodyParser,
  configureCompression,
  configureCors,
  configureGlobalPrefix,
  configureHelmet,
  configureRateLimit,
  configureStaticAssets,
  configureTrustProxy,
} from 'src/bootstrap/bootstrap.utils';
import { ConfigService } from 'src/config/config.service';
import { AppLogger } from 'src/infrastructure/logging/services/app-logger.service';
import {
  startTestPostgres,
  type TestPostgresHandle,
} from '../database/test-postgres';
import { loadTestEnv } from '../env/load-test-env';

export interface E2EAppContext {
  app: INestApplication;
  db: TestPostgresHandle;
}

export async function createE2EApp(): Promise<E2EAppContext> {
  loadTestEnv();

  const db = await startTestPostgres();

  const { AppModule } = await import('src/app.module');

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication<NestExpressApplication>({
    bufferLogs: true,
    bodyParser: false,
  });

  const config = app.get(ConfigService);
  const logger = app.get(AppLogger);

  logger.setContext('E2ETest');

  app.useLogger(logger);
  app.flushLogs();

  configureTrustProxy(app, config);
  configureBodyParser(app, config);
  configureHelmet(app);
  configureCors(app, config);
  configureRateLimit(app, config);
  configureCompression(app, config);
  configureStaticAssets(app, config, logger);
  configureGlobalPrefix(app, config);

  app.useGlobalPipes(
    new I18nValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: false,
      transformOptions: {
        enableImplicitConversion: false,
      },
    }),
  );

  app.enableShutdownHooks();

  await app.init();

  return { app, db };
}

export async function destroyE2EApp(
  ctx?: Partial<E2EAppContext>,
): Promise<void> {
  await ctx?.app?.close();
  await ctx?.db?.stop();
}
