// src/common/limits/decorators/limit-action.decorator.ts
import { applyDecorators, SetMetadata } from '@nestjs/common';
import {
  LIMIT_ACTION_METADATA_KEY,
  LIMIT_DYNAMIC_OPTIONS_METADATA_KEY,
} from '../constants/limit.constants';
import { LimitAction } from '../enums/limit-action.enum';
import type { DynamicLimitOptions } from '../types/dynamic-limit.types';

export interface UseLimitOptions {
  readonly action: LimitAction;
  readonly dynamic?: DynamicLimitOptions;
}

export function UseLimit(
  options: UseLimitOptions,
): MethodDecorator & ClassDecorator {
  const decorators: Array<MethodDecorator & ClassDecorator> = [
    SetMetadata(LIMIT_ACTION_METADATA_KEY, options.action),
  ];

  if (options.action === LimitAction.DYNAMIC) {
    decorators.push(
      SetMetadata(LIMIT_DYNAMIC_OPTIONS_METADATA_KEY, options.dynamic ?? {}),
    );
  }

  return applyDecorators(...decorators);
}

export function LimitConsume(): MethodDecorator & ClassDecorator {
  return UseLimit({ action: LimitAction.CREATE });
}

export const ConsumeLimit = LimitConsume;
export const LimitCreate = LimitConsume;

export function LimitDynamic(
  options: DynamicLimitOptions = {},
): MethodDecorator & ClassDecorator {
  return UseLimit({ action: LimitAction.DYNAMIC, dynamic: options });
}

export const DynamicLimit = LimitDynamic;

export function LimitRelease(): MethodDecorator & ClassDecorator {
  return UseLimit({ action: LimitAction.RELEASE });
}

export const ReleaseLimit = LimitRelease;

export function SkipLimit(): MethodDecorator & ClassDecorator {
  return UseLimit({ action: LimitAction.SKIP });
}
