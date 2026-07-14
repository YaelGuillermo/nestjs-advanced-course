// src/common/serialization/serialization-transformers.ts
import { Transform, type TransformFnParams } from 'class-transformer';

function hasToISOString(
  value: unknown,
): value is { toISOString: () => string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'toISOString' in value &&
    typeof value.toISOString === 'function'
  );
}

function toDateOrNull(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

export function ToIsoDate(): PropertyDecorator {
  return Transform(({ value }: TransformFnParams): string | null => {
    if (value === null || value === undefined) {
      return null;
    }

    if (hasToISOString(value)) {
      return value.toISOString();
    }

    const date = toDateOrNull(value);

    return date ? date.toISOString() : null;
  });
}

export function ToNullableString(): PropertyDecorator {
  return Transform(({ value }: TransformFnParams): string | null => {
    if (value === null || value === undefined) {
      return null;
    }

    return String(value);
  });
}

export function ToNullableNumber(): PropertyDecorator {
  return Transform(({ value }: TransformFnParams): number | null => {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const numberValue = Number(value);

    return Number.isFinite(numberValue) ? numberValue : null;
  });
}

export function ToBooleanValue(): PropertyDecorator {
  return Transform(({ value }: TransformFnParams): boolean => {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();

      return ['true', '1', 'yes', 'y', 'on'].includes(normalized);
    }

    return Boolean(value);
  });
}
