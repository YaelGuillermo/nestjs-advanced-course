// src/common/exceptions/app.exception.ts
import { HttpException, HttpStatus } from '@nestjs/common';
import type {
  ApiErrorKind,
  ApiErrors,
  MessageTemplate,
} from '../responses/response.types';
import {
  GENERAL_ERROR_PATH,
  SYSTEM_ERROR_PATH,
} from '../responses/validation-error.util';

export type AppExceptionKind = Exclude<ApiErrorKind, 'field'>;

export interface AppExceptionOptions {
  errors?: ApiErrors;
  code?: string;
  kind?: AppExceptionKind;
  path?: 'general' | 'system';
}

export class AppException extends HttpException {
  readonly messageTemplate: MessageTemplate;
  readonly errors?: ApiErrors;
  readonly code?: string;
  readonly kind: AppExceptionKind;
  readonly errorPath: 'general' | 'system';

  constructor(
    statusCode: HttpStatus,
    messageTemplate: MessageTemplate,
    errorsOrOptions?: ApiErrors | AppExceptionOptions,
  ) {
    const options = normalizeOptions(errorsOrOptions);
    const kind = resolveExceptionKind(statusCode, options.kind);
    const defaultPath =
      kind === 'system' ? SYSTEM_ERROR_PATH : GENERAL_ERROR_PATH;

    super(
      {
        message: messageTemplate,
        errors: options.errors,
      },
      statusCode,
    );

    this.messageTemplate = messageTemplate;
    this.errors = options.errors;
    this.code = options.code;
    this.kind = kind;
    this.errorPath = options.path ?? defaultPath;
  }
}

function normalizeOptions(
  value?: ApiErrors | AppExceptionOptions,
): AppExceptionOptions {
  if (!value) {
    return {};
  }

  if (isAppExceptionOptions(value)) {
    return value;
  }

  return {
    errors: value,
  };
}

function isAppExceptionOptions(value: unknown): value is AppExceptionOptions {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return (
    'errors' in value || 'code' in value || 'kind' in value || 'path' in value
  );
}

function resolveExceptionKind(
  statusCode: HttpStatus,
  kind?: AppExceptionKind,
): AppExceptionKind {
  if (kind) {
    return kind;
  }

  return Number(statusCode) >= HttpStatus.INTERNAL_SERVER_ERROR
    ? 'system'
    : 'business';
}
