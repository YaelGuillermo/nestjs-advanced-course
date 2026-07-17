// src/modules/accounts/auth/dto/request/refresh-token.dto.ts
import { IsJWT, IsNotEmpty, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class RefreshTokenDto {
  @IsString({ message: i18nValidationMessage('validation.string') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.required') })
  @IsJWT({ message: i18nValidationMessage('validation.jwt') })
  refreshToken: string;
}
