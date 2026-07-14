// src/common/limits/utils/limit-request.util.ts
import type { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';
import type { RequestWithResponseMeta } from 'src/common/responses/response.types';
import { isRecord, readStringProperty } from 'src/common/utils/object.util';

export type LimitRouteParams = Record<string, string>;
export type LimitRequestValues = Record<string, unknown>;

export type LimitRequest = RequestWithResponseMeta<
  LimitRouteParams,
  unknown,
  LimitRequestValues,
  LimitRequestValues
> & {
  user: JwtPayload & { id?: string };
};

/** @deprecated Use LimitRequest. */
export type LimitAwareRequest = LimitRequest;

export function readString(source: unknown, key: string): string | null {
  return isRecord(source) ? readStringProperty(source, key) : null;
}

export function hasStringValue(request: LimitRequest, key: string): boolean {
  return (
    readString(request.body, key) !== null ||
    readString(request.params, key) !== null ||
    readString(request.query, key) !== null
  );
}

export function attachResolvedLimitContext(
  request: LimitRequest,
  field: string,
  value: string,
): void {
  if (!readString(request.params, field)) {
    request.params[field] = value;
  }

  if (!readString(request.query, field)) {
    request.query[field] = value;
  }
}

export function resolveAuthenticatedUserId(
  request: LimitRequest,
): string | null {
  const subject = request.user.sub;
  const id = request.user.id;

  if (typeof subject === 'string' && subject.trim().length > 0) {
    return subject;
  }

  if (typeof id === 'string' && id.trim().length > 0) {
    return id;
  }

  return null;
}
