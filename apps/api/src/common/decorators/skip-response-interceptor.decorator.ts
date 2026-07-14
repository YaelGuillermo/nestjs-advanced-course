// src/common/decorators/skip-response-interceptor.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const SKIP_RESPONSE_INTERCEPTOR_METADATA = 'response:skip-interceptor';

export function SkipResponseInterceptor(): MethodDecorator & ClassDecorator {
  return SetMetadata(SKIP_RESPONSE_INTERCEPTOR_METADATA, true);
}
