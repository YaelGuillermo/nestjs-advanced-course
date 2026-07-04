// src/config/env/env.validation.ts
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { DEVELOPMENT_SECRET_DEFAULTS } from './env.defaults';
import { EnvParseError } from './env.parsers';
import { EnvironmentVariables } from './env.schema';

let validatedEnv: Readonly<EnvironmentVariables> | null = null;

function formatValidationErrors(
  errors: ReturnType<typeof validateSync>,
): string {
  return errors
    .flatMap((error) =>
      Object.values(error.constraints ?? {}).map(
        (constraint) => `${error.property}: ${constraint}`,
      ),
    )
    .join('\n');
}

function applySafeRuntimeDefaults(env: EnvironmentVariables): void {
  if (env.NODE_ENV !== 'production') {
    env.JWT_ACCESS_TOKEN_SECRET ??=
      DEVELOPMENT_SECRET_DEFAULTS.JWT_ACCESS_TOKEN_SECRET;
    env.JWT_REFRESH_TOKEN_SECRET ??=
      DEVELOPMENT_SECRET_DEFAULTS.JWT_REFRESH_TOKEN_SECRET;
    env.SESSION_SECRET ??= DEVELOPMENT_SECRET_DEFAULTS.SESSION_SECRET;
  }

  env.SENTRY_ENVIRONMENT ||= env.NODE_ENV;
  env.SWAGGER_VERSION ||= env.API_VERSION;
}

function hasAny(values: Array<string | undefined>): boolean {
  return values.some((value) => value !== undefined);
}

function hasAll(values: Array<string | undefined>): boolean {
  return values.every((value) => value !== undefined);
}

function pushMissingGroupError(
  errors: string[],
  groupName: string,
  values: Record<string, string | undefined>,
): void {
  if (!hasAny(Object.values(values)) || hasAll(Object.values(values))) return;

  const missingKeys = Object.entries(values)
    .filter(([, value]) => value === undefined)
    .map(([key]) => key)
    .join(', ');

  errors.push(
    `${groupName}: partial configuration detected. Missing required variables: ${missingKeys}.`,
  );
}

function validateCrossFieldRules(env: EnvironmentVariables): string[] {
  const errors: string[] = [];

  if (env.NODE_ENV === 'production') {
    if (
      env.JWT_ACCESS_TOKEN_SECRET ===
      DEVELOPMENT_SECRET_DEFAULTS.JWT_ACCESS_TOKEN_SECRET
    ) {
      errors.push(
        'JWT_ACCESS_TOKEN_SECRET: development default is forbidden in production.',
      );
    }

    if (
      env.JWT_REFRESH_TOKEN_SECRET ===
      DEVELOPMENT_SECRET_DEFAULTS.JWT_REFRESH_TOKEN_SECRET
    ) {
      errors.push(
        'JWT_REFRESH_TOKEN_SECRET: development default is forbidden in production.',
      );
    }

    if (env.SESSION_SECRET === DEVELOPMENT_SECRET_DEFAULTS.SESSION_SECRET) {
      errors.push(
        'SESSION_SECRET: development default is forbidden in production.',
      );
    }

    if (env.DB_SYNCHRONIZE) {
      errors.push('DB_SYNCHRONIZE: must be false in production.');
    }

    if (env.DB_DROP_SCHEMA) {
      errors.push('DB_DROP_SCHEMA: must be false in production.');
    }
  }

  if (
    env.SESSION_COOKIE_SAME_SITE === 'none' &&
    env.SESSION_COOKIE_SECURE === false
  ) {
    errors.push(
      'SESSION_COOKIE_SECURE: must be true when SESSION_COOKIE_SAME_SITE is none.',
    );
  }

  if (env.PAGINATION_DEFAULT_LIMIT > env.PAGINATION_MAX_LIMIT) {
    errors.push(
      'PAGINATION_DEFAULT_LIMIT: must be less than or equal to PAGINATION_MAX_LIMIT.',
    );
  }

  pushMissingGroupError(errors, 'Google OAuth', {
    GOOGLE_OAUTH_CLIENT_ID: env.GOOGLE_OAUTH_CLIENT_ID,
    GOOGLE_OAUTH_CLIENT_SECRET: env.GOOGLE_OAUTH_CLIENT_SECRET,
    GOOGLE_OAUTH_CALLBACK_URL: env.GOOGLE_OAUTH_CALLBACK_URL,
  });

  if (
    env.STRIPE_WEBHOOK_SECRET !== undefined &&
    env.STRIPE_SECRET_KEY === undefined
  ) {
    errors.push(
      'STRIPE_SECRET_KEY: required when STRIPE_WEBHOOK_SECRET is provided.',
    );
  }

  return errors;
}

export function validateEnv(
  config: Record<string, unknown>,
): Readonly<EnvironmentVariables> {
  let env: EnvironmentVariables;

  try {
    env = plainToInstance(EnvironmentVariables, config, {
      enableImplicitConversion: false,
      exposeDefaultValues: true,
    });
  } catch (error) {
    if (error instanceof EnvParseError) {
      throw new Error(`Invalid environment configuration:\n${error.message}`);
    }

    throw error;
  }

  applySafeRuntimeDefaults(env);

  const validationErrors = validateSync(env, {
    skipMissingProperties: false,
    whitelist: false,
    forbidUnknownValues: false,
  });

  const customErrors = validateCrossFieldRules(env);

  if (validationErrors.length > 0 || customErrors.length > 0) {
    const classValidatorMessage = formatValidationErrors(validationErrors);
    const customMessage = customErrors.join('\n');
    const message = [classValidatorMessage, customMessage]
      .filter(Boolean)
      .join('\n');

    throw new Error(`Invalid environment configuration:\n${message}`);
  }

  validatedEnv = Object.freeze(env);
  return validatedEnv;
}

export function getValidatedEnv(): Readonly<EnvironmentVariables> {
  if (!validatedEnv) {
    throw new Error(
      'Environment configuration was requested before validateEnv() completed.',
    );
  }

  return validatedEnv;
}
