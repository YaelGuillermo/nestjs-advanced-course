// src/common/constants/common-message.constants.ts
import { HttpStatus } from '@nestjs/common';
import type { MessageTemplate } from '../responses/response.types';

export const DEFAULT_SUCCESS_MESSAGE_DURATION_MS = 4500;
export const DEFAULT_ERROR_MESSAGE_DURATION_MS = 5000;

export const COMMON_SUCCESS_MESSAGES = {
  OK: {
    title: 'common.success.ok.title',
    description: 'common.success.ok.description',
  },
  CREATED: {
    title: 'common.success.created.title',
    description: 'common.success.created.description',
  },
  UPDATED: {
    title: 'common.success.updated.title',
    description: 'common.success.updated.description',
  },
  DELETED: {
    title: 'common.success.deleted.title',
    description: 'common.success.deleted.description',
  },
} as const satisfies Record<string, MessageTemplate>;

export const COMMON_ERROR_MESSAGES = {
  BAD_REQUEST: {
    title: 'common.errors.bad_request.title',
    description: 'common.errors.bad_request.description',
  },
  UNAUTHORIZED: {
    title: 'common.errors.unauthorized.title',
    description: 'common.errors.unauthorized.description',
  },
  FORBIDDEN: {
    title: 'common.errors.forbidden.title',
    description: 'common.errors.forbidden.description',
  },
  NOT_FOUND: {
    title: 'common.errors.not_found.title',
    description: 'common.errors.not_found.description',
  },
  CONFLICT: {
    title: 'common.errors.conflict.title',
    description: 'common.errors.conflict.description',
  },
  VALIDATION: {
    title: 'common.errors.validation.title',
    description: 'common.errors.validation.description',
  },
  TOO_MANY_REQUESTS: {
    title: 'common.errors.too_many_requests.title',
    description: 'common.errors.too_many_requests.description',
  },
  TIMEOUT: {
    title: 'common.errors.timeout.title',
    description: 'common.errors.timeout.description',
  },
  INTERNAL: {
    title: 'common.errors.internal.title',
    description: 'common.errors.internal.description',
  },
} as const satisfies Record<string, MessageTemplate>;

export const COMMON_ERROR_CODES = {
  BAD_REQUEST: 'bad_request',
  UNAUTHORIZED: 'unauthorized',
  FORBIDDEN: 'forbidden',
  NOT_FOUND: 'not_found',
  CONFLICT: 'conflict',
  VALIDATION: 'validation',
  TOO_MANY_REQUESTS: 'too_many_requests',
  TIMEOUT: 'timeout',
  INTERNAL: 'internal',
} as const;

export type CommonErrorCode =
  (typeof COMMON_ERROR_CODES)[keyof typeof COMMON_ERROR_CODES];

export function getDefaultErrorMessage(statusCode: number): MessageTemplate {
  switch (statusCode) {
    case HttpStatus.BAD_REQUEST:
      return COMMON_ERROR_MESSAGES.BAD_REQUEST;
    case HttpStatus.UNAUTHORIZED:
      return COMMON_ERROR_MESSAGES.UNAUTHORIZED;
    case HttpStatus.FORBIDDEN:
      return COMMON_ERROR_MESSAGES.FORBIDDEN;
    case HttpStatus.NOT_FOUND:
      return COMMON_ERROR_MESSAGES.NOT_FOUND;
    case HttpStatus.CONFLICT:
      return COMMON_ERROR_MESSAGES.CONFLICT;
    case HttpStatus.TOO_MANY_REQUESTS:
      return COMMON_ERROR_MESSAGES.TOO_MANY_REQUESTS;
    case HttpStatus.REQUEST_TIMEOUT:
      return COMMON_ERROR_MESSAGES.TIMEOUT;
    default:
      return COMMON_ERROR_MESSAGES.INTERNAL;
  }
}

export function getDefaultErrorCode(statusCode: number): CommonErrorCode {
  switch (statusCode) {
    case HttpStatus.BAD_REQUEST:
      return COMMON_ERROR_CODES.BAD_REQUEST;
    case HttpStatus.UNAUTHORIZED:
      return COMMON_ERROR_CODES.UNAUTHORIZED;
    case HttpStatus.FORBIDDEN:
      return COMMON_ERROR_CODES.FORBIDDEN;
    case HttpStatus.NOT_FOUND:
      return COMMON_ERROR_CODES.NOT_FOUND;
    case HttpStatus.CONFLICT:
      return COMMON_ERROR_CODES.CONFLICT;
    case HttpStatus.TOO_MANY_REQUESTS:
      return COMMON_ERROR_CODES.TOO_MANY_REQUESTS;
    case HttpStatus.REQUEST_TIMEOUT:
      return COMMON_ERROR_CODES.TIMEOUT;
    default:
      return COMMON_ERROR_CODES.INTERNAL;
  }
}
