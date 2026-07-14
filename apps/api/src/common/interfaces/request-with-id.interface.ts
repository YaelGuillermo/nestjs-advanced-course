// src/common/interfaces/request-with-id.interface.ts
import type { Request } from 'express';

export interface RequestWithId extends Request {
  id?: string;
  requestId?: string;
}
