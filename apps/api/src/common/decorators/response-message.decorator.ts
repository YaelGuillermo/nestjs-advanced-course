// src/common/decorators/response-message.decorator.ts
import { applyDecorators, SetMetadata } from '@nestjs/common';
import type { MessageTemplate } from '../responses/response.types';

export const RESPONSE_MESSAGE_METADATA = 'response:message';

export type ResponseMessageMetadata = MessageTemplate;

export function ResponseMessage(
  message: ResponseMessageMetadata,
): MethodDecorator {
  return applyDecorators(SetMetadata(RESPONSE_MESSAGE_METADATA, message));
}
