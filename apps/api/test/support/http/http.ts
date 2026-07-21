// test/support/http/http.ts
import type { INestApplication } from '@nestjs/common';
import type {
  Response as SupertestResponse,
  Test as SupertestTest,
} from 'supertest';
import type { ApiTestResponse } from '../assertions/api-response.assertions';
import request = require('supertest');

export type RequestHeaders = Record<string, string>;
export type RequestQueryValue = string | number | boolean | null | undefined;
export type RequestQuery = Record<string, RequestQueryValue>;
export type RequestQueryInput = object | URLSearchParams | string;

export interface RequestOptions {
  headers?: RequestHeaders;
  query?: RequestQueryInput;
}

export type TypedResponse<TData = unknown> = Omit<SupertestResponse, 'body'> & {
  body: ApiTestResponse<TData>;
};

function isRequestOptions(
  value: RequestOptions | RequestHeaders,
): value is RequestOptions {
  return 'headers' in value || 'query' in value;
}

function normalizeOptions(
  optionsOrHeaders?: RequestOptions | RequestHeaders,
): RequestOptions {
  if (!optionsOrHeaders) {
    return {};
  }

  if (isRequestOptions(optionsOrHeaders)) {
    return optionsOrHeaders;
  }

  return { headers: optionsOrHeaders };
}

function normalizeQuery(query: RequestQueryInput): RequestQueryInput {
  if (typeof query === 'string' || query instanceof URLSearchParams) {
    return query;
  }

  return Object.fromEntries(
    Object.entries(query as Record<string, RequestQueryValue>).filter(
      ([, value]) => value !== undefined && value !== null,
    ),
  );
}

function applyOptions(
  req: SupertestTest,
  optionsOrHeaders?: RequestOptions | RequestHeaders,
): SupertestTest {
  const options = normalizeOptions(optionsOrHeaders);

  if (options.headers) {
    for (const [key, value] of Object.entries(options.headers)) {
      req.set(key, value);
    }
  }

  if (options.query) {
    const query = normalizeQuery(options.query);

    if (typeof query === 'string' || query instanceof URLSearchParams) {
      req.query(query);
    } else if (Object.keys(query).length > 0) {
      req.query(query);
    }
  }

  return req;
}

export function http(app: INestApplication) {
  const server = app.getHttpServer();

  return {
    async get<TData = unknown>(
      path: string,
      optionsOrHeaders?: RequestOptions | RequestHeaders,
    ): Promise<TypedResponse<TData>> {
      const res = await applyOptions(
        request(server).get(path),
        optionsOrHeaders,
      );

      return res as TypedResponse<TData>;
    },

    async post<TData = unknown, TPayload extends object = object>(
      path: string,
      payload?: TPayload,
      optionsOrHeaders?: RequestOptions | RequestHeaders,
    ): Promise<TypedResponse<TData>> {
      const req = applyOptions(request(server).post(path), optionsOrHeaders);

      if (payload !== undefined) {
        req.send(payload);
      }

      const res = await req;
      return res as TypedResponse<TData>;
    },

    async patch<TData = unknown, TPayload extends object = object>(
      path: string,
      payload?: TPayload,
      optionsOrHeaders?: RequestOptions | RequestHeaders,
    ): Promise<TypedResponse<TData>> {
      const req = applyOptions(request(server).patch(path), optionsOrHeaders);

      if (payload !== undefined) {
        req.send(payload);
      }

      const res = await req;
      return res as TypedResponse<TData>;
    },

    async delete<TData = unknown>(
      path: string,
      optionsOrHeaders?: RequestOptions | RequestHeaders,
    ): Promise<TypedResponse<TData>> {
      const res = await applyOptions(
        request(server).delete(path),
        optionsOrHeaders,
      );

      return res as TypedResponse<TData>;
    },

    bearer(token: string): RequestHeaders {
      return { Authorization: `Bearer ${token}` };
    },
  };
}
