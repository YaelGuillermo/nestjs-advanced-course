// src/modules/accounts/auth/strategies/local.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import type { User } from 'src/modules/accounts/users/entities/user.entity';
import { AUTH_ERRORS } from '../constants/auth-message.constants';
import { AuthService } from '../services/auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: 'identifier', passwordField: 'password' });
  }

  async validate(identifier: string, password: string): Promise<User> {
    try {
      return await this.authService.validateLocalUser({ identifier, password });
    } catch {
      throw new UnauthorizedException(AUTH_ERRORS.INVALID_CREDENTIALS);
    }
  }
}
