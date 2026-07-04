// src/config/loaders/development.config.ts
import { registerAs } from '@nestjs/config';
import { getValidatedEnv } from '../env/env.validation';
import type { DevelopmentConfig } from '../types/config.types';
import { freezeConfig } from '../utils/loader.utils';

export default registerAs('development', (): DevelopmentConfig => {
  const env = getValidatedEnv();

  return freezeConfig({
    debugEnabled: env.DEBUG_ENABLED,
    validationErrorsVisible: env.VALIDATION_ERRORS_VISIBLE,
  });
});
