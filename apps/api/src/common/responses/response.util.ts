// src/common/responses/response.util.ts
import { Lang } from '../enums/lang.enum';
import type {
  LimitFailureReason,
  LimitStrategyType,
} from '../limits/types/limit.types';
import {
  isBoolean,
  isNullOrString,
  isNumber,
  isRecord,
  isString,
} from '../utils/object.util';
import {
  getResponseExtras,
  mergeSuccessResponseExtras,
} from './response-extras.util';
import type {
  ApiLink,
  ApiLinks,
  HttpMethod,
  LimitsInfo,
  PaginationLinks,
  PaginationMeta,
  SuccessPaginationExtra,
  SuccessResponseExtras,
} from './response.types';

const LANG_HEADER = 'x-lang';
const SUPPORTED_LOCALES = new Set<string>(Object.values(Lang));
const SUPPORTED_LIMIT_STRATEGIES = new Set<LimitStrategyType>([
  'user',
  'parent',
  'global',
  'tree',
]);
const SUPPORTED_LIMIT_FAILURE_REASONS = new Set<LimitFailureReason>([
  'limit_reached',
  'tree_depth_reached',
]);
const SUPPORTED_HTTP_METHODS = new Set<HttpMethod>([
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
]);

type HeaderValue = string | string[] | undefined;

interface RequestPathLike {
  __publicPath?: string;
  originalUrl?: string;
  url?: string;
}

interface LocaleAwareRequest extends RequestPathLike {
  i18nLang?: string;
  headers?: Record<string, HeaderValue>;
}

export interface NormalizedSuccessPayload<TData = unknown> {
  data: TData;
  pagination?: SuccessPaginationExtra;
  limits?: LimitsInfo;
  links?: ApiLinks;
}

export function getRequestPath(request: RequestPathLike): string {
  return request.__publicPath || request.originalUrl || request.url || '';
}

export function resolveRequestLocale(request: LocaleAwareRequest): string {
  return (
    normalizeLocaleCandidate(request.i18nLang) ??
    normalizeLocaleCandidate(request.headers?.[LANG_HEADER]) ??
    normalizeLocaleCandidate(extractLocaleFromPath(getRequestPath(request))) ??
    Lang.EN
  );
}

export function normalizeSuccessPayload<TPayload>(
  payload: TPayload,
): NormalizedSuccessPayload<unknown> {
  const hiddenExtras = getResponseExtras(payload);

  if (!isRecord(payload)) {
    return {
      data: payload,
      pagination: hiddenExtras?.pagination,
      limits: hiddenExtras?.limits,
      links: hiddenExtras?.links,
    };
  }

  if ('data' in payload) {
    return normalizeEnvelopePayload(payload.data, payload, hiddenExtras);
  }

  if ('items' in payload) {
    return normalizeEnvelopePayload(payload.items, payload, hiddenExtras);
  }

  return {
    data: payload,
    pagination: hiddenExtras?.pagination,
    limits: hiddenExtras?.limits,
    links: hiddenExtras?.links,
  };
}

export function isPaginationMeta(value: unknown): value is PaginationMeta {
  return (
    isRecord(value) &&
    isNumber(value.currentPage) &&
    isNumber(value.totalPages) &&
    isNumber(value.totalItems) &&
    isNumber(value.pageSize) &&
    isNumber(value.count)
  );
}

export function isPaginationLinks(value: unknown): value is PaginationLinks {
  return (
    isRecord(value) &&
    isNullOrString(value.previous) &&
    isNullOrString(value.next) &&
    isString(value.first) &&
    isString(value.last)
  );
}

export function isPaginationExtra(
  value: unknown,
): value is SuccessPaginationExtra {
  return (
    isRecord(value) &&
    isPaginationMeta(value.meta) &&
    (value.links === undefined || isPaginationLinks(value.links))
  );
}

export function isLimitsInfo(value: unknown): value is LimitsInfo {
  if (!isRecord(value) || !isLimitBase(value)) {
    return false;
  }

  if (!isLimitStrategyType(value.strategy)) {
    return false;
  }

  switch (value.strategy) {
    case 'user':
    case 'global':
      return hasEmptyScope(value);
    case 'parent':
      return hasParentScope(value);
    case 'tree':
      return hasTreeScope(value);
  }
}

export function isHttpMethod(value: unknown): value is HttpMethod {
  return isString(value) && SUPPORTED_HTTP_METHODS.has(value as HttpMethod);
}

export function isApiLink(value: unknown): value is ApiLink {
  return (
    isRecord(value) &&
    isString(value.href) &&
    (value.method === undefined || isHttpMethod(value.method)) &&
    (value.title === undefined || isString(value.title))
  );
}

export function isApiLinks(value: unknown): value is ApiLinks {
  return isRecord(value) && Object.values(value).every(isApiLink);
}

function normalizeEnvelopePayload(
  data: unknown,
  payload: Record<string, unknown>,
  hiddenExtras: SuccessResponseExtras | undefined,
): NormalizedSuccessPayload<unknown> {
  const explicitExtras = extractSuccessExtras(payload);
  const merged = mergeSuccessResponseExtras(hiddenExtras, explicitExtras);

  return {
    data,
    pagination: merged.pagination,
    limits: merged.limits,
    links: merged.links,
  };
}

function extractSuccessExtras(value: Record<string, unknown>) {
  return {
    pagination: isPaginationExtra(value.pagination)
      ? value.pagination
      : undefined,
    limits: isLimitsInfo(value.limits) ? value.limits : undefined,
    links: isApiLinks(value.links) ? value.links : undefined,
  };
}

function normalizeLocaleCandidate(value: unknown): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;

  if (!isString(raw)) {
    return undefined;
  }

  const firstLocale = raw.trim().split(',')[0]?.split(';')[0];

  if (!firstLocale) {
    return undefined;
  }

  const normalized = firstLocale.replace('_', '-').toLowerCase();
  const baseLocale = normalized.split('-')[0] ?? normalized;

  if (SUPPORTED_LOCALES.has(normalized)) {
    return normalized;
  }

  if (SUPPORTED_LOCALES.has(baseLocale)) {
    return baseLocale;
  }

  return undefined;
}

function extractLocaleFromPath(path: string): string | undefined {
  const cleanPath = path.split('?')[0] ?? '';
  const firstSegment = cleanPath.split('/').filter(Boolean)[0];

  return firstSegment || undefined;
}

function isLimitBase(value: Record<string, unknown>): boolean {
  return (
    isNumber(value.current) &&
    isNumber(value.maximum) &&
    isNumber(value.remaining) &&
    isBoolean(value.canCreate) &&
    isNullableLimitReason(value.reason)
  );
}

function isLimitStrategyType(value: unknown): value is LimitStrategyType {
  return (
    isString(value) &&
    SUPPORTED_LIMIT_STRATEGIES.has(value as LimitStrategyType)
  );
}

function isNullableLimitReason(
  value: unknown,
): value is LimitFailureReason | null {
  return (
    value === null ||
    (isString(value) &&
      SUPPORTED_LIMIT_FAILURE_REASONS.has(value as LimitFailureReason))
  );
}

function hasEmptyScope(value: Record<string, unknown>): boolean {
  return (
    value.level === null &&
    value.maxDepth === null &&
    value.parentId === null &&
    value.scopeField === null &&
    value.scopeId === null
  );
}

function hasParentScope(value: Record<string, unknown>): boolean {
  return (
    value.level === null &&
    value.maxDepth === null &&
    isString(value.parentId) &&
    value.scopeField === null &&
    value.scopeId === null
  );
}

function hasTreeScope(value: Record<string, unknown>): boolean {
  return (
    isNumber(value.level) &&
    (isNumber(value.maxDepth) || value.maxDepth === null) &&
    isNullOrString(value.parentId) &&
    isNullOrString(value.scopeField) &&
    isNullOrString(value.scopeId)
  );
}
