// src/common/limits/decorators/limit.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { LIMIT_METADATA_KEY } from '../constants/limit.constants';
import type { LimitConfig } from '../types/limit.types';

export function Limit(config: LimitConfig): ClassDecorator {
  return SetMetadata(LIMIT_METADATA_KEY, config);
}
