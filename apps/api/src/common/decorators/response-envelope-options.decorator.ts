// src/common/decorators/response-envelope-options.decorator.ts
import { SetMetadata } from '@nestjs/common';

export interface ResponseEnvelopeOptions {
  includeRequestLimits?: boolean;
}

export const RESPONSE_ENVELOPE_OPTIONS_METADATA = 'response:envelope-options';

export function SetResponseEnvelopeOptions(
  options: ResponseEnvelopeOptions,
): MethodDecorator & ClassDecorator {
  return SetMetadata(RESPONSE_ENVELOPE_OPTIONS_METADATA, options);
}
