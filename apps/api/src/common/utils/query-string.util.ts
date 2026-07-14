// src/common/utils/query-string.util.ts
export type QueryPrimitive = string | number | boolean | null | undefined;
export type QueryValue = QueryPrimitive | QueryPrimitive[];
export type QueryObject = Record<string, QueryValue | unknown>;

function appendQueryValue(
  target: URLSearchParams,
  key: string,
  value: QueryValue,
): void {
  if (value === undefined || value === null) {
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      appendQueryValue(target, key, item);
    }

    return;
  }

  target.append(key, String(value));
}

export function appendSerializableQueryParams(
  target: URLSearchParams,
  query?: QueryObject,
  options: {
    exclude?: readonly string[];
  } = {},
): void {
  if (!query) {
    return;
  }

  const excludedKeys = new Set(options.exclude ?? []);

  for (const [key, rawValue] of Object.entries(query)) {
    if (excludedKeys.has(key)) {
      continue;
    }

    if (
      typeof rawValue === 'string' ||
      typeof rawValue === 'number' ||
      typeof rawValue === 'boolean' ||
      rawValue === null ||
      rawValue === undefined ||
      Array.isArray(rawValue)
    ) {
      appendQueryValue(target, key, rawValue as QueryValue);
    }
  }
}

export function stripQueryString(path: string): string {
  return path.split('?')[0] ?? path;
}

export function buildUrlWithQuery(
  path: string,
  query: URLSearchParams,
): string {
  const queryString = query.toString();
  return queryString ? `${path}?${queryString}` : path;
}

export function buildPageUrl(
  requestPath: string,
  page: number,
  limit: number,
  query?: QueryObject,
): string {
  const [basePath, currentQueryString] = requestPath.split('?');
  const params = new URLSearchParams(currentQueryString ?? '');

  appendSerializableQueryParams(params, query, {
    exclude: ['page', 'limit'],
  });

  params.set('page', String(page));
  params.set('limit', String(limit));

  return buildUrlWithQuery(basePath, params);
}
