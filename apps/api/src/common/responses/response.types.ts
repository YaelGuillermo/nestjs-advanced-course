// src/common/responses/response.types.ts
import type { Request } from 'express';
import type { ParsedQs } from 'qs';
import type {
  LimitSnapshot,
  LimitStrategyType,
} from '../limits/types/limit.types';

export type MessageArgs = Record<
  string,
  string | number | boolean | null | undefined
>;

export interface MessageTemplate {
  title: string;
  description: string;
  durationMs?: number;
  args?: MessageArgs;
  translate?: boolean;
}

export interface ResponseMessage {
  title: string;
  description: string;
  durationMs: number;
}

export interface PaginationLinks {
  previous: string | null;
  next: string | null;
  first: string;
  last: string;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  count: number;
}

export type { LimitStrategyType };
export type LimitsInfo = LimitSnapshot;

export interface ResponseMeta {
  apiVersion: string;
  environment: string;
  requestId: string;
  locale: string;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiLink {
  href: string;
  method?: HttpMethod;
  title?: string;
}

export type ApiLinks = Record<string, ApiLink>;

export interface SuccessPaginationExtra {
  meta: PaginationMeta;
  links?: PaginationLinks;
}

export interface SuccessResponseExtras {
  pagination?: SuccessPaginationExtra;
  limits?: LimitsInfo;
  links?: ApiLinks;
}

export interface SuccessPayload<TData> extends SuccessResponseExtras {
  data: TData;
}

export interface ApiSuccessResponse<TData> {
  status: true;
  statusCode: number;
  path: string;
  message?: ResponseMessage;
  data: TData;
  pagination?: {
    meta: PaginationMeta;
    links: PaginationLinks;
  };
  links?: ApiLinks;
  limits?: LimitsInfo;
  meta: ResponseMeta;
  timestamp: string;
}

export type ApiErrorKind = 'field' | 'business' | 'system';

export type ReservedErrorPath = 'general' | 'system';

export type ApiErrorPath = ReservedErrorPath | string;

export interface ApiFailure {
  code: string;
  message: string;
}

export interface ApiErrorBag {
  kind: ApiErrorKind;
  failures: ApiFailure[];
}

export type ApiErrors = Record<ApiErrorPath, ApiErrorBag>;

export interface ApiErrorResponse {
  status: false;
  statusCode: number;
  path: string;
  message: ResponseMessage;
  data: null;
  errors?: ApiErrors;
  meta: ResponseMeta;
  timestamp: string;
}

export type RequestWithResponseMeta<
  Params = Record<string, string>,
  ResponseBody = unknown,
  RequestBody = unknown,
  RequestQuery = ParsedQs,
> = Request<Params, ResponseBody, RequestBody, RequestQuery> & {
  id?: string;
  i18nLang?: string;
  __publicPath?: string;
  __limits?: LimitsInfo;
  __responseExtras?: SuccessResponseExtras;
};
