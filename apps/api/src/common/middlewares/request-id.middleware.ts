// src/common/middlewares/request-id.middleware.ts
import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Response } from 'express';
import {
  REQUEST_ID_HEADER,
  RESPONSE_REQUEST_ID_HEADER,
} from '../constants/http.constants';
import type { RequestWithId } from '../interfaces/request-with-id.interface';
import { normalizeRequestId, setRequestId } from '../utils/request-id.util';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: RequestWithId, res: Response, next: NextFunction): void {
    const incomingRequestId = normalizeRequestId(req.header(REQUEST_ID_HEADER));
    const requestId = incomingRequestId ?? crypto.randomUUID();

    setRequestId(req, requestId);
    res.setHeader(RESPONSE_REQUEST_ID_HEADER, requestId);

    next();
  }
}
