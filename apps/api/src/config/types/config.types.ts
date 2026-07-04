// src/config/types/config.types.ts
import { SignOptions } from 'jsonwebtoken';
import type {
  LogFormat,
  LogLevel,
  NodeEnv,
  SessionCookieSameSite,
} from '../env/env.types';

export interface AppConfig {
  nodeEnv: NodeEnv;
  name: string;
  version: string;
  host: string;
  port: number;
  publicUrl: string | null;
  frontendPublicUrl: string;
  cookieDomain: string | null;
  trustProxy: boolean;
}

export interface ApiConfig {
  routePrefix: string;
  version: string;
  fullPrefix: string;
  publicUrl: string | null;
}

export interface PaginationConfig {
  defaultPage: number;
  defaultLimit: number;
  maxLimit: number;
}

export interface AuthConfig {
  jwtAccessTokenSecret: string;
  jwtRefreshTokenSecret: string;
  jwtAccessTokenExpiresIn: SignOptions['expiresIn'];
  jwtRefreshTokenExpiresIn: SignOptions['expiresIn'];
  jwtRefreshTokenCookieName: string;
  passwordBcryptSaltRounds: number;
}

export interface SecurityConfig {
  corsAllowedOrigins: string[];
  corsCredentials: boolean;
  rateLimitTtlSeconds: number;
  rateLimitMaxRequests: number;
  throttleTtlSeconds: number;
  throttleLimit: number;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  name: string;
  username: string;
  password: string;
  schema: string;
  synchronize: boolean;
  dropSchema: boolean;
  logging: boolean;
  ssl: boolean;
  maxConnections: number;
  idleTimeoutMs: number;
  connectionTimeoutMs: number;
  runMigrations: boolean;
  adminDatabase: string;
}

export interface RedisConfig {
  host: string;
  port: number;
  password: string | null;
  db: number;
  ttlSeconds: number;
  keyPrefix: string;
  maxRetries: number;
  connectTimeoutMs: number;
}

export interface QueueConfig {
  prefix: string;
  defaultAttempts: number;
  defaultBackoffMs: number;
}

export interface EmailConfig {
  enabled: boolean;
  host: string | null;
  port: number;
  username: string | null;
  password: string | null;
  fromEmail: string;
  fromName: string;
  secure: boolean;
}

interface BaseStorageConfig {
  publicPath: string;
  publicUrl: string | null;
  fileMaxSizeBytes: number;
  fileAllowedMimeTypes: string[];
  fileMaxFilesPerRequest: number;
}

export interface LocalStorageConfig extends BaseStorageConfig {
  driver: 'local';
  localRootDir: string;
}

export interface S3StorageConfig extends BaseStorageConfig {
  driver: 's3';
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  awsS3BucketName: string;
  awsS3Region: string;
  awsS3Endpoint: string | null;
  awsS3ForcePathStyle: boolean;
  awsS3SignatureVersion: string;
}

export type StorageConfig = LocalStorageConfig | S3StorageConfig;

export interface ObservabilityConfig {
  logLevel: LogLevel;
  logFormat: LogFormat;
  logColorize: boolean;
  logTimestamp: boolean;
  logFilePath: string;
  logMaxSizeBytes: number;
  logMaxFiles: number;
  sentryDsn: string | null;
  sentryTracesSampleRate: number;
  sentryEnvironment: string;
  metricsEnabled: boolean;
  metricsPath: string;
}

export interface FeaturesConfig {
  swaggerEnabled: boolean;
  swaggerPath: string;
  swaggerTitle: string;
  swaggerDescription: string;
  swaggerVersion: string;
  healthChecksEnabled: boolean;
  healthCheckPath: string;
  healthCheckDetailsEnabled: boolean;
  compressionEnabled: boolean;
  compressionThresholdBytes: number;
  compressionLevel: number;
  cacheEnabled: boolean;
  cacheTtlSeconds: number;
}

export type GoogleOAuthConfig =
  | {
      enabled: false;
      callbackRoute: string;
    }
  | {
      enabled: true;
      clientId: string;
      clientSecret: string;
      callbackUrl: string;
      callbackRoute: string;
    };

export type StripeConfig =
  | {
      enabled: false;
      currency: string;
      webhookSecret: null;
    }
  | {
      enabled: true;
      secretKey: string;
      webhookSecret: string | null;
      currency: string;
    };

export interface IntegrationsConfig {
  googleOAuth: GoogleOAuthConfig;
  stripe: StripeConfig;
}

export interface BehaviorConfig {
  requestTimeoutMs: number;
  requestBodyLimitBytes: number;
  responseValidationEnabled: boolean;
  sessionSecret: string;
  sessionMaxAgeMs: number;
  sessionCookieSecure: boolean;
  sessionCookieHttpOnly: boolean;
  sessionCookieSameSite: SessionCookieSameSite;
}

export interface DevelopmentConfig {
  debugEnabled: boolean;
  validationErrorsVisible: boolean;
}
