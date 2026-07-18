// src/modules/accounts/users/dto/request/user-filter.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { BaseFilterDto } from 'src/common/filters/base-filter.dto';
import { parseBooleanish } from 'src/common/utils/boolean.util';
import { AuthProvider } from '../../enums/auth-provider.enum';
import { UserRole } from '../../enums/user-role.enum';
import { UserSortBy } from '../../enums/user-sort-by.enum';

export class UserFilterDto extends BaseFilterDto {
  @ApiPropertyOptional({ enum: UserSortBy })
  @IsOptional()
  @IsEnum(UserSortBy, { message: i18nValidationMessage('validation.enum') })
  override sortBy?: UserSortBy;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole, { message: i18nValidationMessage('validation.enum') })
  role?: UserRole;

  @ApiPropertyOptional({ enum: AuthProvider })
  @IsOptional()
  @IsEnum(AuthProvider, { message: i18nValidationMessage('validation.enum') })
  provider?: AuthProvider;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => parseBooleanish(value))
  @IsBoolean({ message: i18nValidationMessage('validation.boolean') })
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => parseBooleanish(value))
  @IsBoolean({ message: i18nValidationMessage('validation.boolean') })
  isEmailVerified?: boolean;
}
