// src/common/utils/object.util.ts
export type PlainObject = Record<string, unknown>;

export function isRecord(value: unknown): value is PlainObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function hasOwnProperty<TProperty extends PropertyKey>(
  value: unknown,
  property: TProperty,
): value is PlainObject & Record<TProperty, unknown> {
  return (
    isRecord(value) && Object.prototype.hasOwnProperty.call(value, property)
  );
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.trim().length > 0;
}

export function readStringProperty(
  source: PlainObject,
  property: string,
): string | null {
  const value = source[property];
  return isNonEmptyString(value) ? value : null;
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isNull(value: unknown): value is null {
  return value === null;
}

export function isNullOrString(value: unknown): value is string | null {
  return isNull(value) || isString(value);
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

export function compactObject<TValue>(
  input: Record<string, TValue | undefined>,
): Record<string, TValue> {
  return Object.entries(input).reduce<Record<string, TValue>>(
    (acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }

      return acc;
    },
    {},
  );
}
