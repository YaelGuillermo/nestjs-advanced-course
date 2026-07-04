// src/config/loaders/auth.config.ts
import { registerAs } from '@nestjs/config';
import { getValidatedEnv } from '../env/env.validation';
import type { AuthConfig } from '../types/config.types';
import { freezeConfig, requiredEnvValue } from '../utils/loader.utils';

export default registerAs('auth', (): AuthConfig => {
  const env = getValidatedEnv();

  return freezeConfig({
    jwtAccessTokenSecret: requiredEnvValue(
      env.JWT_ACCESS_TOKEN_SECRET,
      'JWT_ACCESS_TOKEN_SECRET',
    ),
    jwtRefreshTokenSecret: requiredEnvValue(
      env.JWT_REFRESH_TOKEN_SECRET,
      'JWT_REFRESH_TOKEN_SECRET',
    ),
    jwtAccessTokenExpiresIn: env.JWT_ACCESS_TOKEN_EXPIRES_IN,
    jwtRefreshTokenExpiresIn: env.JWT_REFRESH_TOKEN_EXPIRES_IN,
    jwtRefreshTokenCookieName: env.JWT_REFRESH_TOKEN_COOKIE_NAME,
    passwordBcryptSaltRounds: env.PASSWORD_BCRYPT_SALT_ROUNDS,
  });
});
