// src/common/interfaces/request-with-user.interface.ts
import type { Request } from 'express';
import type { AuthenticatedUser } from './authenticated-user.interface';

export type RequestWithUser<TUser extends object = AuthenticatedUser> =
  Request & {
    user: TUser;
  };
