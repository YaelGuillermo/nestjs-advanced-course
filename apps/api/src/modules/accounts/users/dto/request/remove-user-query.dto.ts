// src/modules/accounts/users/dto/request/remove-user-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { DeleteMode } from 'src/common/enums/delete-mode.enum';
import { UserFilterDto } from './user-filter.dto';

export class RemoveUserQueryDto extends UserFilterDto {
  @ApiPropertyOptional({ enum: DeleteMode, default: DeleteMode.SOFT })
  @IsOptional()
  @IsEnum(DeleteMode, { message: i18nValidationMessage('validation.enum') })
  mode?: DeleteMode;
}
