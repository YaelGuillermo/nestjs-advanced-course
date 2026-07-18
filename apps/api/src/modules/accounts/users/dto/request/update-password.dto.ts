// src/modules/accounts/users/dto/request/update-password.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { USER_VALIDATION } from '../../constants/user.constants';

export class UpdatePasswordDto {
  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.string') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.required') })
  oldPassword: string;

  @ApiProperty({
    minLength: USER_VALIDATION.PASSWORD_MIN_LENGTH,
    maxLength: USER_VALIDATION.PASSWORD_MAX_LENGTH,
  })
  @IsString({ message: i18nValidationMessage('validation.string') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.required') })
  @MinLength(USER_VALIDATION.PASSWORD_MIN_LENGTH, {
    message: i18nValidationMessage('validation.min_length'),
  })
  @MaxLength(USER_VALIDATION.PASSWORD_MAX_LENGTH, {
    message: i18nValidationMessage('validation.max_length'),
  })
  @Matches(USER_VALIDATION.PASSWORD_COMPLEXITY_REGEX, {
    message: i18nValidationMessage('validation.password_complexity'),
  })
  newPassword: string;

  @ApiProperty({
    minLength: USER_VALIDATION.PASSWORD_MIN_LENGTH,
    maxLength: USER_VALIDATION.PASSWORD_MAX_LENGTH,
  })
  @IsString({ message: i18nValidationMessage('validation.string') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.required') })
  confirmPassword: string;
}
