// src/common/limits/decorators/limit-context.decorator.ts
import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { LimitRequest } from '../utils/limit-request.util';

export const LimitContext = createParamDecorator(
  (_data: never, context: ExecutionContext): LimitRequest => {
    return context.switchToHttp().getRequest<LimitRequest>();
  },
);
