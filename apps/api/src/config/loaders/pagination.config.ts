// src/config/loaders/pagination.config.ts
import { registerAs } from '@nestjs/config';
import { getValidatedEnv } from '../env/env.validation';
import type { PaginationConfig } from '../types/config.types';
import { freezeConfig } from '../utils/loader.utils';

export default registerAs('pagination', (): PaginationConfig => {
  const env = getValidatedEnv();

  return freezeConfig({
    defaultPage: env.PAGINATION_DEFAULT_PAGE,
    defaultLimit: env.PAGINATION_DEFAULT_LIMIT,
    maxLimit: env.PAGINATION_MAX_LIMIT,
  });
});
