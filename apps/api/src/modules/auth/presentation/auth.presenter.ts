// src/modules/accounts/auth/presentation/auth.presenter.ts
import { Injectable } from '@nestjs/common';
import { AuthTokensDto } from '../dto/response/auth-tokens.dto';
import type { AuthTokensPayload } from '../types/auth-tokens.type';

@Injectable()
export class AuthPresenter {
  tokens(tokens: AuthTokensPayload): AuthTokensDto {
    return AuthTokensDto.from(tokens);
  }
}
