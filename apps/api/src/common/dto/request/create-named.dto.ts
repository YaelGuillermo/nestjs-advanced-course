// src/common/dto/request/create-named.dto.ts
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { NAMED_CONFIG } from 'src/common/constants/named.constants';

export class CreateNamedDto {
  @IsString({ message: i18nValidationMessage('validation.string') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.required') })
  @MinLength(NAMED_CONFIG.NAME_MIN_LENGTH, {
    message: i18nValidationMessage('validation.min_length'),
  })
  @MaxLength(NAMED_CONFIG.NAME_MAX_LENGTH, {
    message: i18nValidationMessage('validation.max_length'),
  })
  @Matches(NAMED_CONFIG.NAME_REGEX, {
    message: i18nValidationMessage('validation.name_format'),
  })
  name!: string;

  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.string') })
  @MinLength(NAMED_CONFIG.DESCRIPTION_MIN_LENGTH, {
    message: i18nValidationMessage('validation.min_length'),
  })
  @MaxLength(NAMED_CONFIG.DESCRIPTION_MAX_LENGTH, {
    message: i18nValidationMessage('validation.max_length'),
  })
  description?: string | null;
}
