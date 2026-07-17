// src/modules/accounts/auth/dto/request/login.dto.ts
import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { USER_VALIDATION } from 'src/modules/accounts/users/constants/user.constants';

export class LoginDto {
  @IsString({ message: i18nValidationMessage('validation.string') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.required') })
  @MinLength(USER_VALIDATION.USERNAME_MIN_LENGTH, {
    message: i18nValidationMessage('validation.min_length'),
  })
  @MaxLength(USER_VALIDATION.EMAIL_MAX_LENGTH, {
    message: i18nValidationMessage('validation.max_length'),
  })
  @Matches(USER_VALIDATION.LOGIN_IDENTIFIER_REGEX, {
    message: i18nValidationMessage('validation.username_or_email_format'),
  })
  identifier: string;

  @IsString({ message: i18nValidationMessage('validation.string') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.required') })
  @MinLength(USER_VALIDATION.PASSWORD_MIN_LENGTH, {
    message: i18nValidationMessage('validation.min_length'),
  })
  @MaxLength(USER_VALIDATION.PASSWORD_MAX_LENGTH, {
    message: i18nValidationMessage('validation.max_length'),
  })
  password: string;
}
