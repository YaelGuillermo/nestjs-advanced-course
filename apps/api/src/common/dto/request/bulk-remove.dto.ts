// src/common/dto/request/bulk-remove.dto.ts
import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class BulkRemoveDto {
  @IsArray({ message: i18nValidationMessage('validation.array') })
  @ArrayNotEmpty({
    message: i18nValidationMessage('validation.array_not_empty'),
  })
  @IsUUID('4', {
    each: true,
    message: i18nValidationMessage('validation.uuid'),
  })
  ids!: string[];
}
