// src/main.ts
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { I18nValidationPipe } from 'nestjs-i18n';
import { AppModule } from './app.module';
import {
  buildApplicationUrl,
  configureBodyParser,
  configureCompression,
  configureCors,
  configureGlobalPrefix,
  configureHelmet,
  configureRateLimit,
  configureStaticAssets,
  configureSwagger,
  configureTrustProxy,
} from './bootstrap/bootstrap.utils';
import { langPrefixExpressMiddleware } from './common/middlewares/lang-prefix-express.middleware';
import { ConfigService } from './config/config.service';
import { AppLogger } from './infrastructure/logging/services/app-logger.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    bodyParser: false,
  });

  app.use(langPrefixExpressMiddleware);

  const config = app.get(ConfigService);
  const logger = app.get(AppLogger);

  logger.setContext('Bootstrap');

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

  configureSwagger(app, config, logger);
  app.enableShutdownHooks();

  await app.listen(config.app.port, config.app.host);

  logger.log(`Application started in ${config.nodeEnv} mode.`);
  logger.log(`Listening on ${buildApplicationUrl(config)}`);
  logger.log(`Health check: /${config.healthCheckPath}`);
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
