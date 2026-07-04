// src/config/env/env.schema.ts
import { Transform } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ENV_DEFAULTS } from './env.defaults';
import {
  parseBoolean,
  parseCsv,
  parseFloatNumber,
  parseInteger,
  parseOptionalString,
} from './env.parsers';
import {
  LOG_FORMAT_VALUES,
  LOG_LEVEL_VALUES,
  NODE_ENV_VALUES,
  SESSION_COOKIE_SAME_SITE_VALUES,
  STORAGE_DRIVER_VALUES,
  type LogFormat,
  type LogLevel,
  type NodeEnv,
  type SessionCookieSameSite,
  type StorageDriver,
} from './env.types';

function hasProvidedKey(obj: unknown, key: string): boolean {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    Object.prototype.hasOwnProperty.call(obj, key)
  );
}

const BooleanEnv = (defaultValue: boolean) =>
  Transform(({ value, key, obj }) => {
    const parsed = parseBoolean(value, String(key));
    if (parsed !== undefined) return parsed;
    return hasProvidedKey(obj, String(key)) ? undefined : defaultValue;
  });

const IntegerEnv = (defaultValue: number) =>
  Transform(({ value, key, obj }) => {
    const parsed = parseInteger(value, String(key));
    if (parsed !== undefined) return parsed;
    return hasProvidedKey(obj, String(key)) ? undefined : defaultValue;
  });

const FloatEnv = (defaultValue: number) =>
  Transform(({ value, key, obj }) => {
    const parsed = parseFloatNumber(value, String(key));
    if (parsed !== undefined) return parsed;
    return hasProvidedKey(obj, String(key)) ? undefined : defaultValue;
  });

const CsvEnv = (defaultValue: string[]) =>
  Transform(({ value, key, obj }) => {
    const parsed = parseCsv(value, String(key));
    if (parsed !== undefined) return parsed;
    return hasProvidedKey(obj, String(key)) ? undefined : [...defaultValue];
  });

const OptionalStringEnv = () =>
  Transform(({ value }) => parseOptionalString(value));

export class EnvironmentVariables {
  @IsIn(NODE_ENV_VALUES)
  NODE_ENV: NodeEnv = ENV_DEFAULTS.NODE_ENV;

  @IsString()
  @MinLength(1)
  APP_NAME = ENV_DEFAULTS.APP_NAME;

  @IsString()
  @Matches(/^\d+\.\d+(\.\d+)?([+-][\w.-]+)?$/)
  APP_VERSION = ENV_DEFAULTS.APP_VERSION;

  @IsString()
  @MinLength(1)
  APP_HOST = ENV_DEFAULTS.APP_HOST;

  @IntegerEnv(ENV_DEFAULTS.APP_PORT)
  @IsInt()
  @Min(1)
  @Max(65535)
  APP_PORT = ENV_DEFAULTS.APP_PORT;

  @OptionalStringEnv()
  @IsOptional()
  @IsUrl({ require_tld: false })
  APP_PUBLIC_URL?: string;

  @IsUrl({ require_tld: false })
  FRONTEND_PUBLIC_URL = ENV_DEFAULTS.FRONTEND_PUBLIC_URL;

  @OptionalStringEnv()
  @IsOptional()
  @IsString()
  COOKIE_DOMAIN?: string;

  @BooleanEnv(ENV_DEFAULTS.TRUST_PROXY)
  @IsBoolean()
  TRUST_PROXY = ENV_DEFAULTS.TRUST_PROXY;

  @IsString()
  @Matches(/^[a-z][a-z0-9-]*$/)
  API_ROUTE_PREFIX = ENV_DEFAULTS.API_ROUTE_PREFIX;

  @IsString()
  @Matches(/^v\d+$/)
  API_VERSION = ENV_DEFAULTS.API_VERSION;

  @OptionalStringEnv()
  @IsOptional()
  @IsUrl({ require_tld: false })
  API_PUBLIC_URL?: string;

  @IntegerEnv(ENV_DEFAULTS.PAGINATION_DEFAULT_PAGE)
  @IsInt()
  @Min(1)
  PAGINATION_DEFAULT_PAGE = ENV_DEFAULTS.PAGINATION_DEFAULT_PAGE;

  @IntegerEnv(ENV_DEFAULTS.PAGINATION_DEFAULT_LIMIT)
  @IsInt()
  @Min(1)
  PAGINATION_DEFAULT_LIMIT = ENV_DEFAULTS.PAGINATION_DEFAULT_LIMIT;

  @IntegerEnv(ENV_DEFAULTS.PAGINATION_MAX_LIMIT)
  @IsInt()
  @Min(1)
  PAGINATION_MAX_LIMIT = ENV_DEFAULTS.PAGINATION_MAX_LIMIT;

  @OptionalStringEnv()
  @ValidateIf(
    (env: EnvironmentVariables) =>
      env.NODE_ENV === 'production' ||
      env.JWT_ACCESS_TOKEN_SECRET !== undefined,
  )
  @IsString()
  @MinLength(32)
  JWT_ACCESS_TOKEN_SECRET?: string;

  @OptionalStringEnv()
  @ValidateIf(
    (env: EnvironmentVariables) =>
      env.NODE_ENV === 'production' ||
      env.JWT_REFRESH_TOKEN_SECRET !== undefined,
  )
  @IsString()
  @MinLength(32)
  JWT_REFRESH_TOKEN_SECRET?: string;

  @IsString()
  @Matches(/^\d+[smhd]$/)
  JWT_ACCESS_TOKEN_EXPIRES_IN = ENV_DEFAULTS.JWT_ACCESS_TOKEN_EXPIRES_IN;

  @IsString()
  @Matches(/^\d+[smhd]$/)
  JWT_REFRESH_TOKEN_EXPIRES_IN = ENV_DEFAULTS.JWT_REFRESH_TOKEN_EXPIRES_IN;

  @IsString()
  @MinLength(1)
  JWT_REFRESH_TOKEN_COOKIE_NAME = ENV_DEFAULTS.JWT_REFRESH_TOKEN_COOKIE_NAME;

  @IntegerEnv(ENV_DEFAULTS.PASSWORD_BCRYPT_SALT_ROUNDS)
  @IsInt()
  @Min(4)
  @Max(16)
  PASSWORD_BCRYPT_SALT_ROUNDS = ENV_DEFAULTS.PASSWORD_BCRYPT_SALT_ROUNDS;

  @CsvEnv(ENV_DEFAULTS.CORS_ALLOWED_ORIGINS)
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  CORS_ALLOWED_ORIGINS: string[] = [...ENV_DEFAULTS.CORS_ALLOWED_ORIGINS];

  @BooleanEnv(ENV_DEFAULTS.CORS_CREDENTIALS)
  @IsBoolean()
  CORS_CREDENTIALS = ENV_DEFAULTS.CORS_CREDENTIALS;

  @IntegerEnv(ENV_DEFAULTS.RATE_LIMIT_TTL_SECONDS)
  @IsInt()
  @Min(1)
  RATE_LIMIT_TTL_SECONDS = ENV_DEFAULTS.RATE_LIMIT_TTL_SECONDS;

  @IntegerEnv(ENV_DEFAULTS.RATE_LIMIT_MAX_REQUESTS)
  @IsInt()
  @Min(1)
  RATE_LIMIT_MAX_REQUESTS = ENV_DEFAULTS.RATE_LIMIT_MAX_REQUESTS;

  @IntegerEnv(ENV_DEFAULTS.THROTTLE_TTL_SECONDS)
  @IsInt()
  @Min(1)
  THROTTLE_TTL_SECONDS = ENV_DEFAULTS.THROTTLE_TTL_SECONDS;

  @IntegerEnv(ENV_DEFAULTS.THROTTLE_LIMIT)
  @IsInt()
  @Min(1)
  THROTTLE_LIMIT = ENV_DEFAULTS.THROTTLE_LIMIT;

  @IsString()
  @MinLength(1)
  DB_HOST = ENV_DEFAULTS.DB_HOST;

  @IntegerEnv(ENV_DEFAULTS.DB_PORT)
  @IsInt()
  @Min(1)
  @Max(65535)
  DB_PORT = ENV_DEFAULTS.DB_PORT;

  @IsString()
  @MinLength(1)
  DB_NAME = ENV_DEFAULTS.DB_NAME;

  @IsString()
  @MinLength(1)
  DB_USERNAME = ENV_DEFAULTS.DB_USERNAME;

  @IsString()
  DB_PASSWORD = ENV_DEFAULTS.DB_PASSWORD;

  @IsString()
  @MinLength(1)
  DB_SCHEMA = ENV_DEFAULTS.DB_SCHEMA;

  @BooleanEnv(ENV_DEFAULTS.DB_SYNCHRONIZE)
  @IsBoolean()
  DB_SYNCHRONIZE = ENV_DEFAULTS.DB_SYNCHRONIZE;

  @BooleanEnv(ENV_DEFAULTS.DB_DROP_SCHEMA)
  @IsBoolean()
  DB_DROP_SCHEMA = ENV_DEFAULTS.DB_DROP_SCHEMA;

  @BooleanEnv(ENV_DEFAULTS.DB_LOGGING)
  @IsBoolean()
  DB_LOGGING = ENV_DEFAULTS.DB_LOGGING;

  @BooleanEnv(ENV_DEFAULTS.DB_SSL)
  @IsBoolean()
  DB_SSL = ENV_DEFAULTS.DB_SSL;

  @IntegerEnv(ENV_DEFAULTS.DB_MAX_CONNECTIONS)
  @IsInt()
  @Min(1)
  DB_MAX_CONNECTIONS = ENV_DEFAULTS.DB_MAX_CONNECTIONS;

  @IntegerEnv(ENV_DEFAULTS.DB_IDLE_TIMEOUT_MS)
  @IsInt()
  @Min(1)
  DB_IDLE_TIMEOUT_MS = ENV_DEFAULTS.DB_IDLE_TIMEOUT_MS;

  @IntegerEnv(ENV_DEFAULTS.DB_CONNECTION_TIMEOUT_MS)
  @IsInt()
  @Min(1)
  DB_CONNECTION_TIMEOUT_MS = ENV_DEFAULTS.DB_CONNECTION_TIMEOUT_MS;

  @BooleanEnv(ENV_DEFAULTS.DB_RUN_MIGRATIONS)
  @IsBoolean()
  DB_RUN_MIGRATIONS = ENV_DEFAULTS.DB_RUN_MIGRATIONS;

  @IsString()
  @MinLength(1)
  DB_ADMIN_DATABASE = ENV_DEFAULTS.DB_ADMIN_DATABASE;

  @IsString()
  @MinLength(1)
  REDIS_HOST = ENV_DEFAULTS.REDIS_HOST;

  @IntegerEnv(ENV_DEFAULTS.REDIS_PORT)
  @IsInt()
  @Min(1)
  @Max(65535)
  REDIS_PORT = ENV_DEFAULTS.REDIS_PORT;

  @OptionalStringEnv()
  @IsOptional()
  @IsString()
  REDIS_PASSWORD?: string;

  @IntegerEnv(ENV_DEFAULTS.REDIS_DB)
  @IsInt()
  @Min(0)
  REDIS_DB = ENV_DEFAULTS.REDIS_DB;

  @IntegerEnv(ENV_DEFAULTS.REDIS_TTL_SECONDS)
  @IsInt()
  @Min(1)
  REDIS_TTL_SECONDS = ENV_DEFAULTS.REDIS_TTL_SECONDS;

  @IsString()
  @MinLength(1)
  REDIS_KEY_PREFIX = ENV_DEFAULTS.REDIS_KEY_PREFIX;

  @IntegerEnv(ENV_DEFAULTS.REDIS_MAX_RETRIES)
  @IsInt()
  @Min(0)
  REDIS_MAX_RETRIES = ENV_DEFAULTS.REDIS_MAX_RETRIES;

  @IntegerEnv(ENV_DEFAULTS.REDIS_CONNECT_TIMEOUT_MS)
  @IsInt()
  @Min(1)
  REDIS_CONNECT_TIMEOUT_MS = ENV_DEFAULTS.REDIS_CONNECT_TIMEOUT_MS;

  @IsString()
  @MinLength(1)
  QUEUE_PREFIX = ENV_DEFAULTS.QUEUE_PREFIX;

  @IntegerEnv(ENV_DEFAULTS.QUEUE_DEFAULT_ATTEMPTS)
  @IsInt()
  @Min(1)
  QUEUE_DEFAULT_ATTEMPTS = ENV_DEFAULTS.QUEUE_DEFAULT_ATTEMPTS;

  @IntegerEnv(ENV_DEFAULTS.QUEUE_DEFAULT_BACKOFF_MS)
  @IsInt()
  @Min(0)
  QUEUE_DEFAULT_BACKOFF_MS = ENV_DEFAULTS.QUEUE_DEFAULT_BACKOFF_MS;

  @OptionalStringEnv()
  @IsOptional()
  @IsString()
  @MinLength(1)
  SMTP_HOST?: string;

  @IntegerEnv(ENV_DEFAULTS.SMTP_PORT)
  @ValidateIf(
    (env: EnvironmentVariables) =>
      env.SMTP_HOST !== undefined || env.SMTP_PORT !== undefined,
  )
  @IsInt()
  @Min(1)
  @Max(65535)
  SMTP_PORT = ENV_DEFAULTS.SMTP_PORT;

  @OptionalStringEnv()
  @IsOptional()
  @IsString()
  SMTP_USERNAME?: string;

  @OptionalStringEnv()
  @IsOptional()
  @IsString()
  SMTP_PASSWORD?: string;

  @IsEmail()
  SMTP_FROM_EMAIL = ENV_DEFAULTS.SMTP_FROM_EMAIL;

  @IsString()
  @MinLength(1)
  SMTP_FROM_NAME = ENV_DEFAULTS.SMTP_FROM_NAME;

  @BooleanEnv(ENV_DEFAULTS.SMTP_SECURE)
  @IsBoolean()
  SMTP_SECURE = ENV_DEFAULTS.SMTP_SECURE;

  @IsIn(STORAGE_DRIVER_VALUES)
  STORAGE_DRIVER: StorageDriver = ENV_DEFAULTS.STORAGE_DRIVER;

  @IsString()
  @MinLength(1)
  STORAGE_LOCAL_ROOT_DIR = ENV_DEFAULTS.STORAGE_LOCAL_ROOT_DIR;

  @IsString()
  @MinLength(1)
  STORAGE_PUBLIC_PATH = ENV_DEFAULTS.STORAGE_PUBLIC_PATH;

  @OptionalStringEnv()
  @IsOptional()
  @IsUrl({ require_tld: false })
  STORAGE_PUBLIC_URL?: string;

  @OptionalStringEnv()
  @ValidateIf(
    (env: EnvironmentVariables) =>
      env.STORAGE_DRIVER === 's3' || env.AWS_ACCESS_KEY_ID !== undefined,
  )
  @IsString()
  @MinLength(1)
  AWS_ACCESS_KEY_ID?: string;

  @OptionalStringEnv()
  @ValidateIf(
    (env: EnvironmentVariables) =>
      env.STORAGE_DRIVER === 's3' || env.AWS_SECRET_ACCESS_KEY !== undefined,
  )
  @IsString()
  @MinLength(1)
  AWS_SECRET_ACCESS_KEY?: string;

  @OptionalStringEnv()
  @ValidateIf(
    (env: EnvironmentVariables) =>
      env.STORAGE_DRIVER === 's3' || env.AWS_S3_BUCKET_NAME !== undefined,
  )
  @IsString()
  @MinLength(1)
  AWS_S3_BUCKET_NAME?: string;

  @IsString()
  @MinLength(1)
  AWS_S3_REGION = ENV_DEFAULTS.AWS_S3_REGION;

  @OptionalStringEnv()
  @IsOptional()
  @IsString()
  AWS_S3_ENDPOINT?: string;

  @BooleanEnv(ENV_DEFAULTS.AWS_S3_FORCE_PATH_STYLE)
  @IsBoolean()
  AWS_S3_FORCE_PATH_STYLE = ENV_DEFAULTS.AWS_S3_FORCE_PATH_STYLE;

  @IsString()
  @MinLength(1)
  AWS_S3_SIGNATURE_VERSION = ENV_DEFAULTS.AWS_S3_SIGNATURE_VERSION;

  @IntegerEnv(ENV_DEFAULTS.FILE_MAX_SIZE_BYTES)
  @IsInt()
  @Min(1)
  @Max(104857600)
  FILE_MAX_SIZE_BYTES = ENV_DEFAULTS.FILE_MAX_SIZE_BYTES;

  @CsvEnv(ENV_DEFAULTS.FILE_ALLOWED_MIME_TYPES)
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  FILE_ALLOWED_MIME_TYPES: string[] = [...ENV_DEFAULTS.FILE_ALLOWED_MIME_TYPES];

  @IntegerEnv(ENV_DEFAULTS.FILE_MAX_FILES_PER_REQUEST)
  @IsInt()
  @Min(1)
  @Max(20)
  FILE_MAX_FILES_PER_REQUEST = ENV_DEFAULTS.FILE_MAX_FILES_PER_REQUEST;

  @IsIn(LOG_LEVEL_VALUES)
  LOG_LEVEL: LogLevel = ENV_DEFAULTS.LOG_LEVEL;

  @IsIn(LOG_FORMAT_VALUES)
  LOG_FORMAT: LogFormat = ENV_DEFAULTS.LOG_FORMAT;

  @BooleanEnv(ENV_DEFAULTS.LOG_COLORIZE)
  @IsBoolean()
  LOG_COLORIZE = ENV_DEFAULTS.LOG_COLORIZE;

  @BooleanEnv(ENV_DEFAULTS.LOG_TIMESTAMP)
  @IsBoolean()
  LOG_TIMESTAMP = ENV_DEFAULTS.LOG_TIMESTAMP;

  @IsString()
  @MinLength(1)
  LOG_FILE_PATH = ENV_DEFAULTS.LOG_FILE_PATH;

  @IntegerEnv(ENV_DEFAULTS.LOG_MAX_SIZE_BYTES)
  @IsInt()
  @Min(1)
  LOG_MAX_SIZE_BYTES = ENV_DEFAULTS.LOG_MAX_SIZE_BYTES;

  @IntegerEnv(ENV_DEFAULTS.LOG_MAX_FILES)
  @IsInt()
  @Min(1)
  LOG_MAX_FILES = ENV_DEFAULTS.LOG_MAX_FILES;

  @OptionalStringEnv()
  @IsOptional()
  @IsString()
  SENTRY_DSN?: string;

  @FloatEnv(ENV_DEFAULTS.SENTRY_TRACES_SAMPLE_RATE)
  @IsNumber()
  @Min(0)
  @Max(1)
  SENTRY_TRACES_SAMPLE_RATE = ENV_DEFAULTS.SENTRY_TRACES_SAMPLE_RATE;

  @IsString()
  @MinLength(1)
  SENTRY_ENVIRONMENT: string = ENV_DEFAULTS.NODE_ENV;

  @BooleanEnv(ENV_DEFAULTS.METRICS_ENABLED)
  @IsBoolean()
  METRICS_ENABLED = ENV_DEFAULTS.METRICS_ENABLED;

  @IsString()
  @MinLength(1)
  METRICS_PATH = ENV_DEFAULTS.METRICS_PATH;

  @BooleanEnv(ENV_DEFAULTS.SWAGGER_ENABLED)
  @IsBoolean()
  SWAGGER_ENABLED = ENV_DEFAULTS.SWAGGER_ENABLED;

  @IsString()
  @MinLength(1)
  SWAGGER_PATH = ENV_DEFAULTS.SWAGGER_PATH;

  @IsString()
  @MinLength(1)
  SWAGGER_TITLE = ENV_DEFAULTS.SWAGGER_TITLE;

  @IsString()
  @MinLength(1)
  SWAGGER_DESCRIPTION = ENV_DEFAULTS.SWAGGER_DESCRIPTION;

  @IsString()
  @Matches(/^v\d+$/)
  SWAGGER_VERSION: string = ENV_DEFAULTS.SWAGGER_VERSION;

  @BooleanEnv(ENV_DEFAULTS.HEALTH_CHECKS_ENABLED)
  @IsBoolean()
  HEALTH_CHECKS_ENABLED = ENV_DEFAULTS.HEALTH_CHECKS_ENABLED;

  @IsString()
  @Matches(/^[a-z][a-z0-9-\/]*$/)
  HEALTH_CHECK_PATH = ENV_DEFAULTS.HEALTH_CHECK_PATH;

  @BooleanEnv(ENV_DEFAULTS.HEALTH_CHECK_DETAILS_ENABLED)
  @IsBoolean()
  HEALTH_CHECK_DETAILS_ENABLED = ENV_DEFAULTS.HEALTH_CHECK_DETAILS_ENABLED;

  @BooleanEnv(ENV_DEFAULTS.COMPRESSION_ENABLED)
  @IsBoolean()
  COMPRESSION_ENABLED = ENV_DEFAULTS.COMPRESSION_ENABLED;

  @IntegerEnv(ENV_DEFAULTS.COMPRESSION_THRESHOLD_BYTES)
  @IsInt()
  @Min(0)
  COMPRESSION_THRESHOLD_BYTES = ENV_DEFAULTS.COMPRESSION_THRESHOLD_BYTES;

  @IntegerEnv(ENV_DEFAULTS.COMPRESSION_LEVEL)
  @IsInt()
  @Min(0)
  @Max(9)
  COMPRESSION_LEVEL = ENV_DEFAULTS.COMPRESSION_LEVEL;

  @BooleanEnv(ENV_DEFAULTS.CACHE_ENABLED)
  @IsBoolean()
  CACHE_ENABLED = ENV_DEFAULTS.CACHE_ENABLED;

  @IntegerEnv(ENV_DEFAULTS.CACHE_TTL_SECONDS)
  @IsInt()
  @Min(1)
  CACHE_TTL_SECONDS = ENV_DEFAULTS.CACHE_TTL_SECONDS;

  @OptionalStringEnv()
  @IsOptional()
  @IsString()
  GOOGLE_OAUTH_CLIENT_ID?: string;

  @OptionalStringEnv()
  @IsOptional()
  @IsString()
  GOOGLE_OAUTH_CLIENT_SECRET?: string;

  @OptionalStringEnv()
  @IsOptional()
  @IsUrl({ require_tld: false })
  GOOGLE_OAUTH_CALLBACK_URL?: string;

  @IsString()
  @MinLength(1)
  GOOGLE_OAUTH_CALLBACK_ROUTE = ENV_DEFAULTS.GOOGLE_OAUTH_CALLBACK_ROUTE;

  @OptionalStringEnv()
  @IsOptional()
  @IsString()
  STRIPE_SECRET_KEY?: string;

  @OptionalStringEnv()
  @IsOptional()
  @IsString()
  STRIPE_WEBHOOK_SECRET?: string;

  @IsString()
  @Matches(/^[a-z]{3}$/)
  STRIPE_CURRENCY = ENV_DEFAULTS.STRIPE_CURRENCY;

  @IntegerEnv(ENV_DEFAULTS.REQUEST_TIMEOUT_MS)
  @IsInt()
  @Min(1)
  REQUEST_TIMEOUT_MS = ENV_DEFAULTS.REQUEST_TIMEOUT_MS;

  @IntegerEnv(ENV_DEFAULTS.REQUEST_BODY_LIMIT_BYTES)
  @IsInt()
  @Min(1)
  REQUEST_BODY_LIMIT_BYTES = ENV_DEFAULTS.REQUEST_BODY_LIMIT_BYTES;

  @BooleanEnv(ENV_DEFAULTS.RESPONSE_VALIDATION_ENABLED)
  @IsBoolean()
  RESPONSE_VALIDATION_ENABLED = ENV_DEFAULTS.RESPONSE_VALIDATION_ENABLED;

  @OptionalStringEnv()
  @ValidateIf(
    (env: EnvironmentVariables) =>
      env.NODE_ENV === 'production' || env.SESSION_SECRET !== undefined,
  )
  @IsString()
  @MinLength(32)
  SESSION_SECRET?: string;

  @IntegerEnv(ENV_DEFAULTS.SESSION_MAX_AGE_MS)
  @IsInt()
  @Min(1)
  SESSION_MAX_AGE_MS = ENV_DEFAULTS.SESSION_MAX_AGE_MS;

  @BooleanEnv(ENV_DEFAULTS.SESSION_COOKIE_SECURE)
  @IsBoolean()
  SESSION_COOKIE_SECURE = ENV_DEFAULTS.SESSION_COOKIE_SECURE;

  @BooleanEnv(ENV_DEFAULTS.SESSION_COOKIE_HTTP_ONLY)
  @IsBoolean()
  SESSION_COOKIE_HTTP_ONLY = ENV_DEFAULTS.SESSION_COOKIE_HTTP_ONLY;

  @IsIn(SESSION_COOKIE_SAME_SITE_VALUES)
  SESSION_COOKIE_SAME_SITE: SessionCookieSameSite =
    ENV_DEFAULTS.SESSION_COOKIE_SAME_SITE;

  @BooleanEnv(ENV_DEFAULTS.DEBUG_ENABLED)
  @IsBoolean()
  DEBUG_ENABLED = ENV_DEFAULTS.DEBUG_ENABLED;

  @BooleanEnv(ENV_DEFAULTS.VALIDATION_ERRORS_VISIBLE)
  @IsBoolean()
  VALIDATION_ERRORS_VISIBLE = ENV_DEFAULTS.VALIDATION_ERRORS_VISIBLE;
}
