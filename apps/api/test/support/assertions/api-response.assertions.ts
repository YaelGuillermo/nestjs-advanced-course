// test/support/assertions/api-response.assertions.ts
import type {
  ApiErrorResponse as AppApiErrorResponse,
  ApiSuccessResponse as AppApiSuccessResponse,
} from 'src/common/responses/response.types';

type TextExpectation = string | RegExp;

export interface ExpectedMessage {
  title?: TextExpectation;
  description?: TextExpectation;
}

export interface ExpectBaseResponseOptions {
  statusCode: number;
  path?: string | RegExp;
  locale?: string;
  message?: ExpectedMessage;
}

export type ApiSuccessResponse<TData = unknown> = AppApiSuccessResponse<TData>;
export type ApiErrorResponse = AppApiErrorResponse;
export type ApiTestResponse<TData = unknown> =
  ApiSuccessResponse<TData> | ApiErrorResponse;

function expectText(value: unknown, expected: TextExpectation): void {
  expect(typeof value).toBe('string');

  if (expected instanceof RegExp) {
    expect(value).toMatch(expected);
    return;
  }

  expect(value).toBe(expected);
}

function expectPath(value: unknown, expected?: string | RegExp): void {
  if (expected === undefined) {
    return;
  }

  expect(typeof value).toBe('string');

  if (expected instanceof RegExp) {
    expect(value).toMatch(expected);
    return;
  }

  expect(value).toBe(expected);
}

function expectLocale(
  response: { meta?: { locale?: string } },
  locale?: string,
): void {
  if (locale === undefined) {
    return;
  }

  expect(response.meta).toEqual(expect.any(Object));
  expect(response.meta?.locale).toBe(locale);
}

export function expectSuccessResponse<TData = unknown>(
  body: unknown,
  options: ExpectBaseResponseOptions,
): asserts body is ApiSuccessResponse<TData> {
  expect(body).toEqual(expect.any(Object));

  const response = body as Partial<ApiSuccessResponse<TData>>;

  expect(response.status).toBe(true);
  expect(response.statusCode).toBe(options.statusCode);
  expectPath(response.path, options.path);
  expect(response).toHaveProperty('data');
  expectLocale(response, options.locale);

  if (options.message?.title !== undefined) {
    expect(response.message).toBeDefined();
    expectText(response.message?.title, options.message.title);
  }

  if (options.message?.description !== undefined) {
    expect(response.message).toBeDefined();
    expectText(response.message?.description, options.message.description);
  }
}

export function expectErrorResponse(
  body: unknown,
  options: ExpectBaseResponseOptions,
): asserts body is ApiErrorResponse {
  expect(body).toEqual(expect.any(Object));

  const response = body as Partial<ApiErrorResponse>;

  expect(response.status).toBe(false);
  expect(response.statusCode).toBe(options.statusCode);
  expectPath(response.path, options.path);
  expectLocale(response, options.locale);

  if (options.message?.title !== undefined) {
    expect(response.message).toBeDefined();
    expectText(response.message?.title, options.message.title);
  }

  if (options.message?.description !== undefined) {
    expect(response.message).toBeDefined();
    expectText(response.message?.description, options.message.description);
  }
}

export function expectUuidString(value: unknown): asserts value is string {
  expect(typeof value).toBe('string');
  expect(value).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  );
}

export function expectIsoDateString(value: unknown): asserts value is string {
  expect(typeof value).toBe('string');
  expect(Number.isNaN(Date.parse(value as string))).toBe(false);
}

export function requireResponseData<TData>(
  body: ApiSuccessResponse<TData>,
): TData {
  expect(body.data).toBeDefined();
  expect(body.data).not.toBeNull();

  if (body.data == null) {
    throw new Error('Expected response.data to be defined.');
  }

  return body.data;
}
