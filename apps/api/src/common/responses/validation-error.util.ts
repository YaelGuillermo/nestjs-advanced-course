// src/common/responses/validation-error.util.ts
import type { ValidationError } from 'class-validator';
import { I18nValidationException } from 'nestjs-i18n';
import { isRecord } from '../utils/object.util';
import type { ApiErrorBag, ApiErrorKind, ApiErrors } from './response.types';

export const GENERAL_ERROR_PATH = 'general';
export const SYSTEM_ERROR_PATH = 'system';

const GENERIC_VALIDATION_PROPERTIES = new Set([
  'field',
  'property',
  'value',
  'unknown',
]);

export interface ParsedI18nMessage {
  key: string;
  args: Record<string, unknown>;
}

export interface FlattenedValidationError {
  path: string;
  error: ValidationError;
}

export function parseI18nMessage(raw: string): ParsedI18nMessage | null {
  const trimmed = raw.trim();

  if (!trimmed) {
    return null;
  }

  const separatorIndex = trimmed.indexOf('|');

  if (separatorIndex === -1) {
    return isLikelyI18nKey(trimmed)
      ? {
          key: trimmed,
          args: {},
        }
      : null;
  }

  const key = trimmed.slice(0, separatorIndex).trim();
  const jsonPayload = trimmed.slice(separatorIndex + 1).trim();

  if (!key) {
    return null;
  }

  return {
    key,
    args: parseI18nArgs(jsonPayload),
  };
}

export function isValidationI18nMessage(raw: string): boolean {
  return parseI18nMessage(raw)?.key.startsWith('validation.') ?? false;
}

export function getI18nFailureCode(raw: string, fallback: string): string {
  const parsed = parseI18nMessage(raw);

  if (!parsed) {
    return fallback;
  }

  const parts = parsed.key.split('.').filter(Boolean);

  return parts.length > 0 ? parts[parts.length - 1] : fallback;
}

export function getParsedI18nProperty(raw: string): string | undefined {
  const parsed = parseI18nMessage(raw);

  if (!parsed) {
    return undefined;
  }

  const property = getStringValue(parsed.args.property);

  if (!property || isGenericValidationProperty(property)) {
    return undefined;
  }

  return property;
}

export function isGenericValidationProperty(value: unknown): boolean {
  const property = getStringValue(value);

  if (!property) {
    return true;
  }

  return GENERIC_VALIDATION_PROPERTIES.has(property.toLowerCase());
}

export function normalizeConstraintCode(code: string): string {
  const normalized = code
    .replace(/^is(?=[A-Z])/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s.-]+/g, '_')
    .toLowerCase();

  const aliases: Record<string, string> = {
    not_empty: 'required',
    whitelist_validation: 'unknown_field',
    array_not_empty: 'required',
    nested_validation: 'nested',
  };

  return aliases[normalized] ?? normalized;
}

export function flattenValidationErrors(
  errors: readonly ValidationError[],
  parentPath = '',
): FlattenedValidationError[] {
  return errors.flatMap((error) => {
    const property = normalizePathPart(error.property);
    const currentPath = buildValidationPath(parentPath, property);

    const current =
      currentPath &&
      error.constraints &&
      Object.keys(error.constraints).length > 0
        ? [{ path: currentPath, error }]
        : [];

    const children = Array.isArray(error.children)
      ? flattenValidationErrors(error.children, currentPath)
      : [];

    return [...current, ...children];
  });
}

export function extractValidationErrors(
  exception: unknown,
  exceptionResponse: unknown,
): ValidationError[] | undefined {
  if (exception instanceof I18nValidationException) {
    const errors = exception.errors;

    if (Array.isArray(errors) && errors.every(isValidationError)) {
      return errors;
    }
  }

  const exceptionErrors = getValidationErrorsFromObject(exception);

  if (exceptionErrors) {
    return exceptionErrors;
  }

  if (isRecord(exceptionResponse)) {
    const responseErrors = exceptionResponse.errors;

    if (
      Array.isArray(responseErrors) &&
      responseErrors.every(isValidationError)
    ) {
      return responseErrors;
    }

    const responseMessage = exceptionResponse.message;

    if (
      Array.isArray(responseMessage) &&
      responseMessage.every(isValidationError)
    ) {
      return responseMessage;
    }
  }

  if (
    Array.isArray(exceptionResponse) &&
    exceptionResponse.every(isValidationError)
  ) {
    return exceptionResponse;
  }

  return undefined;
}

export function appendFailure(
  bag: ApiErrors,
  path: string,
  code: string,
  message: string,
  kind: ApiErrorKind,
): ApiErrors {
  const safePath = normalizeErrorPath(path);
  const current = bag[safePath] ?? createEmptyErrorBag(kind);

  return {
    ...bag,
    [safePath]: {
      kind: current.kind,
      failures: [...current.failures, { code, message }],
    },
  };
}

export function appendFieldFailure(
  bag: ApiErrors,
  field: string,
  code: string,
  message: string,
): ApiErrors {
  return appendFailure(bag, field, code, message, 'field');
}

export function appendBusinessFailure(
  bag: ApiErrors,
  code: string,
  message: string,
): ApiErrors {
  return appendFailure(bag, GENERAL_ERROR_PATH, code, message, 'business');
}

export function appendSystemFailure(
  bag: ApiErrors,
  code: string,
  message: string,
): ApiErrors {
  return appendFailure(bag, SYSTEM_ERROR_PATH, code, message, 'system');
}

export function isApiErrors(value: unknown): value is ApiErrors {
  if (!isRecord(value)) {
    return false;
  }

  return Object.values(value).every((entry) => {
    return (
      isRecord(entry) &&
      isApiErrorKind(entry.kind) &&
      Array.isArray(entry.failures) &&
      entry.failures.every((failure) => {
        return (
          isRecord(failure) &&
          typeof failure.code === 'string' &&
          typeof failure.message === 'string'
        );
      })
    );
  });
}

export function hasApiErrors(errors: ApiErrors): boolean {
  return Object.keys(errors).length > 0;
}

function createEmptyErrorBag(kind: ApiErrorKind): ApiErrorBag {
  return {
    kind,
    failures: [],
  };
}

function normalizeErrorPath(path: string): string {
  const trimmed = path.trim();

  return trimmed || GENERAL_ERROR_PATH;
}

function buildValidationPath(parentPath: string, property?: string): string {
  if (!property) {
    return parentPath;
  }

  return parentPath ? `${parentPath}.${property}` : property;
}

function normalizePathPart(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed || undefined;
}

function getValidationErrorsFromObject(
  value: unknown,
): ValidationError[] | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const errors = value.errors;

  if (Array.isArray(errors) && errors.every(isValidationError)) {
    return errors;
  }

  return undefined;
}

function parseI18nArgs(jsonPayload: string): Record<string, unknown> {
  if (!jsonPayload) {
    return {};
  }

  try {
    const parsed = JSON.parse(jsonPayload) as unknown;

    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function isLikelyI18nKey(value: string): boolean {
  return /^[a-zA-Z0-9_.-]+$/.test(value) && value.includes('.');
}

function isValidationError(value: unknown): value is ValidationError {
  if (!isRecord(value)) {
    return false;
  }

  const hasProperty = typeof value.property === 'string';
  const hasConstraints = isRecord(value.constraints);
  const hasChildren = Array.isArray(value.children);

  return hasProperty && (hasConstraints || hasChildren);
}

function getStringValue(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed || undefined;
}

function isApiErrorKind(value: unknown): value is ApiErrorKind {
  return value === 'field' || value === 'business' || value === 'system';
}
