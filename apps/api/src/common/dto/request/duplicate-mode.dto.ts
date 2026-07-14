// src/common/dto/request/duplicate-mode.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { DuplicateMode } from 'src/common/enums/duplicate-mode.enum';
import { LangQueryDto } from './lang-query.dto';

export class DuplicateModeDto extends LangQueryDto {
  @ApiPropertyOptional({ enum: DuplicateMode, default: DuplicateMode.SHALLOW })
  @IsOptional()
  @IsEnum(DuplicateMode, { message: i18nValidationMessage('validation.enum') })
  mode?: DuplicateMode;
}
