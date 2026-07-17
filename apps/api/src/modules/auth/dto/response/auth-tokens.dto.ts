// src/modules/accounts/auth/dto/response/auth-tokens.dto.ts
import { Expose } from 'class-transformer';
import { serialize } from 'src/common/serialization/serialize';
import type { AuthTokensPayload } from '../../types/auth-tokens.type';

const AUTH_TOKEN_GROUP = 'auth:tokens';

export class AuthTokensDto {
  @Expose({ groups: [AUTH_TOKEN_GROUP] })
  accessToken: string;

  @Expose({ groups: [AUTH_TOKEN_GROUP] })
  refreshToken: string;

  @Expose({ groups: [AUTH_TOKEN_GROUP] })
  expiresIn: number;

  @Expose({ groups: [AUTH_TOKEN_GROUP] })
  tokenType: string;

  static from(payload: AuthTokensPayload): AuthTokensDto {
    return serialize(AuthTokensDto, payload, {
      groups: [AUTH_TOKEN_GROUP],
    });
  }
}
