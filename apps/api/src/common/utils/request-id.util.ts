// src/common/utils/request-id.util.ts
import { randomUUID } from 'crypto';
import type { Request } from 'express';
import type { RequestWithId } from '../interfaces/request-with-id.interface';

export function normalizeRequestId(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : undefined;
}

export function getRequestId(request: Request): string | undefined {
  const requestWithId = request as RequestWithId;

  return requestWithId.requestId ?? requestWithId.id;
}

export function setRequestId(request: RequestWithId, requestId: string): void {
  request.id = requestId;
  request.requestId = requestId;
}

export function resolveRequestId(request: Request): string {
  const existingRequestId = getRequestId(request);

  return existingRequestId ?? randomUUID();
}
