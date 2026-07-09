// src/infrastructure/logging/middlewares/http-logger.middleware.ts
import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { HTTP_CONTEXT } from 'src/common/constants/http.constants';
import { getRequestId } from 'src/common/utils/request-id.util';
import { AppLogger } from '../services/app-logger.service';

type HeaderValue = number | string | string[] | undefined;

interface HttpLogPayload {
  requestId?: string;
  method: string;
  url: string;
  statusCode: number;
  durationMs: number;
  contentLength?: string;
  userAgent?: string;
  ip?: string;
}

function normalizeHeaderValue(value: HeaderValue): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value.join(', ');
  }

  return String(value);
}

function getDurationMs(startedAt: bigint): number {
  const durationNs = process.hrtime.bigint() - startedAt;

  return Math.round(Number(durationNs) / 1_000_000);
}

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: AppLogger) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const startedAt = process.hrtime.bigint();

    res.once('finish', () => {
      const payload: HttpLogPayload = {
        requestId: getRequestId(req),
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode: res.statusCode,
        durationMs: getDurationMs(startedAt),
        contentLength: normalizeHeaderValue(res.getHeader('content-length')),
        userAgent: req.get('user-agent'),
        ip: req.ip,
      };

      if (res.statusCode >= 500) {
        this.logger.error(payload, undefined, HTTP_CONTEXT);
        return;
      }

      if (res.statusCode >= 400) {
        this.logger.warn(payload, HTTP_CONTEXT);
        return;
      }

      this.logger.log(payload, HTTP_CONTEXT);
    });

    next();
  }
}
