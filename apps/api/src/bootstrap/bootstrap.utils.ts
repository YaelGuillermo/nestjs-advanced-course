// src/bootstrap/bootstrap.utils.ts
import type { LoggerService } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded, type Request } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { ConfigService } from 'src/config/config.service';
import {
  normalizeMediaPublicPath,
  resolveMediaRootDir,
} from 'src/infrastructure/storage/utils/media-paths.util';
import compression = require('compression');

function toAbsolutePath(path: string): string {
  const normalized = String(path ?? '')
    .trim()
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');

  return normalized ? `/${normalized}` : '/';
}

function routeStartsWith(requestPath: string, targetPath: string): boolean {
  const current = toAbsolutePath(requestPath);
  const target = toAbsolutePath(targetPath);

  return current === target || current.startsWith(`${target}/`);
}

function buildBaseUrl(config: ConfigService): string {
  const configuredUrl = config.app.publicUrl ?? config.api.publicUrl;

  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, '');
  }

  const host = config.app.host === '0.0.0.0' ? 'localhost' : config.app.host;
  return `http://${host}:${config.app.port}`;
}

export function configureTrustProxy(
  app: NestExpressApplication,
  config: ConfigService,
): void {
  if (config.app.trustProxy) {
    app.set('trust proxy', 1);
  }
}

export function configureBodyParser(
  app: NestExpressApplication,
  config: ConfigService,
): void {
  const limit = config.behavior.requestBodyLimitBytes;

  app.use(json({ limit }));
  app.use(urlencoded({ extended: true, limit }));
}

export function configureHelmet(app: NestExpressApplication): void {
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
}

export function configureCors(
  app: NestExpressApplication,
  config: ConfigService,
): void {
  const allowedOrigins = config.security.corsAllowedOrigins;
  const credentials = config.security.corsCredentials;
  const allowsAnyOrigin = allowedOrigins.includes('*');

  app.enableCors({
    credentials,
    origin:
      allowsAnyOrigin && !credentials
        ? true
        : (
            origin: string | undefined,
            callback: (error: Error | null, allow?: boolean) => void,
          ) => {
            if (!origin) {
              callback(null, true);
              return;
            }

            if (allowsAnyOrigin || allowedOrigins.includes(origin)) {
              callback(null, true);
              return;
            }

            callback(new Error(`CORS origin not allowed: ${origin}`), false);
          },
  });
}

export function configureRateLimit(
  app: NestExpressApplication,
  config: ConfigService,
): void {
  const max = config.security.rateLimitMaxRequests;

  if (max <= 0) {
    return;
  }

  const skippedPaths = [
    config.healthCheckPath,
    config.swaggerPath,
    config.observability.metricsPath,
  ];

  app.use(
    rateLimit({
      windowMs: config.security.rateLimitTtlSeconds * 1000,
      max,
      standardHeaders: true,
      legacyHeaders: false,
      skip: (request: Request) =>
        skippedPaths.some((path) => routeStartsWith(request.path, path)),
    }),
  );
}

export function configureCompression(
  app: NestExpressApplication,
  config: ConfigService,
): void {
  if (!config.features.compressionEnabled) {
    return;
  }

  app.use(
    compression({
      threshold: config.features.compressionThresholdBytes,
      level: config.features.compressionLevel,
    }),
  );
}

export function configureStaticAssets(
  app: NestExpressApplication,
  config: ConfigService,
  logger: LoggerService,
): void {
  const storage = config.storage;

  if (storage.driver !== 'local') {
    logger.log(
      `Static media disabled because storage driver is ${storage.driver}.`,
    );
    return;
  }

  const rootDir = resolveMediaRootDir(storage.localRootDir);
  const publicPath = normalizeMediaPublicPath(storage.publicPath);

  app.useStaticAssets(rootDir, {
    prefix: publicPath,
  });

  logger.log(`Static media enabled: ${publicPath} -> ${rootDir}`);
}

export function configureGlobalPrefix(
  app: NestExpressApplication,
  config: ConfigService,
): void {
  app.setGlobalPrefix(config.api.fullPrefix);
}

export function configureSwagger(
  app: NestExpressApplication,
  config: ConfigService,
  logger: LoggerService,
): void {
  if (!config.features.swaggerEnabled) {
    return;
  }

  const swaggerConfig = new DocumentBuilder()
    .setTitle(config.features.swaggerTitle)
    .setDescription(config.features.swaggerDescription)
    .setVersion(config.features.swaggerVersion)
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  const swaggerPath = config.swaggerPath;

  SwaggerModule.setup(swaggerPath, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  logger.log(`Swagger available at ${toAbsolutePath(swaggerPath)}`);
}

export function buildApplicationUrl(config: ConfigService): string {
  return `${buildBaseUrl(config)}${config.apiBasePath}`;
}
