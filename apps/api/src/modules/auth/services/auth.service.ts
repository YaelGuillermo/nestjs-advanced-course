// src/modules/accounts/auth/services/auth.service.ts
import { Injectable } from '@nestjs/common';
import type { User } from 'src/modules/accounts/users/entities/user.entity';
import type { LoginDto } from '../dto/request/login.dto';
import type { RegisterDto } from '../dto/request/register.dto';
import type { GoogleProfile } from '../interfaces/google-profile.interface';
import type { AuthTokensPayload } from '../types/auth-tokens.type';
import { AuthCommandService } from './auth-command.service';
import { AuthValidationService } from './auth-validation.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly authValidationService: AuthValidationService,
    private readonly authCommandService: AuthCommandService,
  ) {}

  validateLocalUser(dto: LoginDto): Promise<User> {
    return this.authValidationService.validateLocalUser(dto);
  }

  validateGoogleUser(profile: GoogleProfile): Promise<User> {
    return this.authValidationService.validateGoogleUser(profile);
  }

  login(user: User): Promise<AuthTokensPayload> {
    return this.authCommandService.login(user);
  }

  register(dto: RegisterDto): Promise<AuthTokensPayload> {
    return this.authCommandService.register(dto);
  }

  refreshToken(refreshToken: string): Promise<AuthTokensPayload> {
    return this.authCommandService.refreshToken(refreshToken);
  }

  logout(userId: string, token?: string): Promise<void> {
    return this.authCommandService.logout(userId, token);
  }
}
