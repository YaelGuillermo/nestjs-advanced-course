// src/common/responses/collection-response.util.ts
import { buildPageUrl } from '../utils/query-string.util';
import type { HateoasService } from './hateoas.service';
import { attachResponseExtras } from './response-extras.util';
import type {
  ApiLinks,
  LimitsInfo,
  PaginationLinks,
  PaginationMeta,
} from './response.types';

const COLLECTION_CONTROL_SEGMENTS = ['pagination', 'limits', 'hateoas'];

export interface CollectionPaginationData {
  meta: PaginationMeta;
}

export interface CollectionEnvelopeExtras {
  pagination?: CollectionPaginationData & { links?: PaginationLinks };
  limits?: LimitsInfo;
  links?: ApiLinks;
}

export interface CollectionResponseExtras {
  pagination: { meta: PaginationMeta; links: PaginationLinks };
  links: ApiLinks;
  limits?: LimitsInfo;
}

export function buildCollectionPath(requestPath: string): string {
  const [pathname, rawQueryString = ''] = requestPath.split('?');
  const collectionPath = removeCollectionControlSegment(pathname);
  const query = new URLSearchParams(rawQueryString);

  query.delete('page');
  query.delete('limit');

  const queryString = query.toString();
  return queryString ? `${collectionPath}?${queryString}` : collectionPath;
}

export function buildCollectionPagination(
  requestPath: string,
  pagination: CollectionPaginationData,
): { meta: PaginationMeta; links: PaginationLinks } {
  const basePath = buildCollectionPath(requestPath);
  const { meta } = pagination;

  return {
    meta,
    links: {
      previous: buildPreviousPageUrl(basePath, meta),
      next: buildNextPageUrl(basePath, meta),
      first: buildPageUrl(basePath, 1, meta.pageSize),
      last: buildPageUrl(basePath, meta.totalPages, meta.pageSize),
    },
  };
}

export function buildCollectionHateoas(
  requestPath: string,
  hateoasService: HateoasService,
  pagination?: { links: PaginationLinks },
): ApiLinks {
  return hateoasService.buildCollectionLinks({
    path: buildCollectionPath(requestPath),
    first: pagination?.links.first,
    last: pagination?.links.last,
    previous: pagination?.links.previous,
    next: pagination?.links.next,
  });
}

export function buildCollectionHateoasFromPagination(
  requestPath: string,
  hateoasService: HateoasService,
  pagination: CollectionPaginationData,
): ApiLinks {
  return buildCollectionHateoas(
    requestPath,
    hateoasService,
    buildCollectionPagination(requestPath, pagination),
  );
}

export function attachCollection<TData>(
  data: TData,
  extras: CollectionEnvelopeExtras = {},
): TData {
  return attachResponseExtras(data, extras);
}

function removeCollectionControlSegment(pathname: string): string {
  const segments = pathname.split('/');
  const lastSegment = segments[segments.length - 1] ?? '';

  if (!COLLECTION_CONTROL_SEGMENTS.includes(lastSegment)) {
    return pathname;
  }

  const nextSegments = segments.slice(0, -1);
  const nextPath = nextSegments.join('/');

  return nextPath.length > 0 ? nextPath : '/';
}

function buildPreviousPageUrl(
  basePath: string,
  meta: PaginationMeta,
): string | null {
  if (meta.currentPage <= 1) {
    return null;
  }

  return buildPageUrl(basePath, meta.currentPage - 1, meta.pageSize);
}

function buildNextPageUrl(
  basePath: string,
  meta: PaginationMeta,
): string | null {
  if (meta.currentPage >= meta.totalPages) {
    return null;
  }

  return buildPageUrl(basePath, meta.currentPage + 1, meta.pageSize);
}
