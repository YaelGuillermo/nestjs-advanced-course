// src/modules/accounts/auth/guards/google-auth.guard.ts
import { Injectable, type ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(_context: ExecutionContext): { session: false } {
    return { session: false };
  }
}
