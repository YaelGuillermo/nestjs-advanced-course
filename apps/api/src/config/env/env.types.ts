// src/config/env/env.types.ts
export const NODE_ENV_VALUES = ['development', 'production', 'test'] as const;
export type NodeEnv = (typeof NODE_ENV_VALUES)[number];

export const STORAGE_DRIVER_VALUES = ['local', 's3'] as const;
export type StorageDriver = (typeof STORAGE_DRIVER_VALUES)[number];

export const LOG_LEVEL_VALUES = [
  'error',
  'warn',
  'log',
  'info',
  'debug',
  'verbose',
] as const;
export type LogLevel = (typeof LOG_LEVEL_VALUES)[number];

export const LOG_FORMAT_VALUES = ['json', 'pretty', 'simple'] as const;
export type LogFormat = (typeof LOG_FORMAT_VALUES)[number];

export const SESSION_COOKIE_SAME_SITE_VALUES = [
  'strict',
  'lax',
  'none',
] as const;
export type SessionCookieSameSite =
  (typeof SESSION_COOKIE_SAME_SITE_VALUES)[number];

export type Nullable<T> = T | null;
