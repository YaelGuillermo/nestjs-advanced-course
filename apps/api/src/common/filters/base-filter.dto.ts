// src/common/filters/base-filter.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { DeletedScope } from '../enums/deleted-scope.enum';
import { Lang } from '../enums/lang.enum';
import { SortOrder } from '../enums/sort-order.enum';
import { PaginationFilterDto } from './pagination-filter.dto';

export class BaseFilterDto extends PaginationFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.string') })
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.string') })
  sortBy?: string;

  @ApiPropertyOptional({ enum: SortOrder })
  @IsOptional()
  @IsEnum(SortOrder, { message: i18nValidationMessage('validation.enum') })
  sortOrder?: SortOrder;

  @ApiPropertyOptional({ enum: DeletedScope })
  @IsOptional()
  @IsEnum(DeletedScope, { message: i18nValidationMessage('validation.enum') })
  deleted?: DeletedScope;

  @ApiPropertyOptional({ enum: Lang })
  @IsOptional()
  @IsEnum(Lang, { message: i18nValidationMessage('validation.enum') })
  lang?: Lang;
}
