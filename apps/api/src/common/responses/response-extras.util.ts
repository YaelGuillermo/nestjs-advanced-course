// src/common/responses/response-extras.util.ts
import { isRecord } from '../utils/object.util';
import type { SuccessResponseExtras } from './response.types';

const RESPONSE_EXTRAS_SYMBOL = Symbol.for('app.response.extras');

function canStoreExtras(value: unknown): value is object {
  return (
    (typeof value === 'object' || typeof value === 'function') && value !== null
  );
}

export function mergeSuccessResponseExtras(
  base: SuccessResponseExtras = {},
  extra: SuccessResponseExtras = {},
): SuccessResponseExtras {
  const links = {
    ...(base.links ?? {}),
    ...(extra.links ?? {}),
  };

  return {
    pagination: extra.pagination ?? base.pagination,
    limits: extra.limits ?? base.limits,
    links: Object.keys(links).length > 0 ? links : undefined,
  };
}

export function attachResponseExtras<TData>(
  data: TData,
  extras: SuccessResponseExtras,
): TData {
  if (!canStoreExtras(data)) {
    return data;
  }

  const current = getResponseExtras(data) ?? {};

  Object.defineProperty(data, RESPONSE_EXTRAS_SYMBOL, {
    value: mergeSuccessResponseExtras(current, extras),
    enumerable: false,
    configurable: true,
  });

  return data;
}

export function getResponseExtras(
  value: unknown,
): SuccessResponseExtras | undefined {
  if (!canStoreExtras(value)) {
    return undefined;
  }

  const extras = Reflect.get(value, RESPONSE_EXTRAS_SYMBOL);

  return isSuccessResponseExtras(extras) ? extras : undefined;
}

function isSuccessResponseExtras(
  value: unknown,
): value is SuccessResponseExtras {
  if (!isRecord(value)) {
    return false;
  }

  return 'pagination' in value || 'limits' in value || 'links' in value;
}
