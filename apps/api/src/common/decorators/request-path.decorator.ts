// src/common/decorators/request-path.decorator.ts
import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { RequestWithResponseMeta } from '../responses/response.types';
import { getRequestPath } from '../responses/response.util';

export const RequestPath = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<RequestWithResponseMeta>();
    return getRequestPath(request);
  },
);
