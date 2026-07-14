// src/common/dto/request/lang-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { Lang } from 'src/common/enums/lang.enum';

export class LangQueryDto {
  @ApiPropertyOptional({ enum: Lang })
  @IsOptional()
  @IsEnum(Lang, { message: i18nValidationMessage('validation.enum') })
  lang?: Lang;
}
