// src/common/dto/request/delete-mode.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { DeleteMode } from 'src/common/enums/delete-mode.enum';
import { LangQueryDto } from './lang-query.dto';

export class DeleteModeDto extends LangQueryDto {
  @ApiPropertyOptional({ enum: DeleteMode, default: DeleteMode.SOFT })
  @IsOptional()
  @IsEnum(DeleteMode, { message: i18nValidationMessage('validation.enum') })
  mode?: DeleteMode;
}
