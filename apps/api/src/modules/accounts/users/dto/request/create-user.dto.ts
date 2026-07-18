// src/modules/accounts/users/dto/request/create-user.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { USER_VALIDATION } from '../../constants/user.constants';
import { AuthProvider } from '../../enums/auth-provider.enum';
import { UserRole } from '../../enums/user-role.enum';

export class CreateUserDto {
  @ApiProperty({
    minLength: USER_VALIDATION.USERNAME_MIN_LENGTH,
    maxLength: USER_VALIDATION.USERNAME_MAX_LENGTH,
  })
  @IsString({ message: i18nValidationMessage('validation.string') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.required') })
  @MinLength(USER_VALIDATION.USERNAME_MIN_LENGTH, {
    message: i18nValidationMessage('validation.min_length'),
  })
  @MaxLength(USER_VALIDATION.USERNAME_MAX_LENGTH, {
    message: i18nValidationMessage('validation.max_length'),
  })
  @Matches(USER_VALIDATION.USERNAME_REGEX, {
    message: i18nValidationMessage('users.validation.username_format'),
  })
  username: string;

  @ApiPropertyOptional({
    minLength: USER_VALIDATION.NAME_MIN_LENGTH,
    maxLength: USER_VALIDATION.NAME_MAX_LENGTH,
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.string') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.required') })
  @MinLength(USER_VALIDATION.NAME_MIN_LENGTH, {
    message: i18nValidationMessage('validation.min_length'),
  })
  @MaxLength(USER_VALIDATION.NAME_MAX_LENGTH, {
    message: i18nValidationMessage('validation.max_length'),
  })
  @Matches(USER_VALIDATION.PERSON_NAME_REGEX, {
    message: i18nValidationMessage('users.validation.person_name_format'),
  })
  firstName?: string;

  @ApiPropertyOptional({
    minLength: USER_VALIDATION.NAME_MIN_LENGTH,
    maxLength: USER_VALIDATION.NAME_MAX_LENGTH,
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.string') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.required') })
  @MinLength(USER_VALIDATION.NAME_MIN_LENGTH, {
    message: i18nValidationMessage('validation.min_length'),
  })
  @MaxLength(USER_VALIDATION.NAME_MAX_LENGTH, {
    message: i18nValidationMessage('validation.max_length'),
  })
  @Matches(USER_VALIDATION.PERSON_NAME_REGEX, {
    message: i18nValidationMessage('users.validation.person_name_format'),
  })
  lastName?: string;

  @ApiProperty({ maxLength: USER_VALIDATION.EMAIL_MAX_LENGTH })
  @IsEmail({}, { message: i18nValidationMessage('validation.email') })
  @MinLength(USER_VALIDATION.EMAIL_MIN_LENGTH, {
    message: i18nValidationMessage('validation.min_length'),
  })
  @MaxLength(USER_VALIDATION.EMAIL_MAX_LENGTH, {
    message: i18nValidationMessage('validation.max_length'),
  })
  @Matches(USER_VALIDATION.EMAIL_LOWERCASE_REGEX, {
    message: i18nValidationMessage('validation.email'),
  })
  email: string;

  @ApiPropertyOptional({
    minLength: USER_VALIDATION.PASSWORD_MIN_LENGTH,
    maxLength: USER_VALIDATION.PASSWORD_MAX_LENGTH,
  })
  @ValidateIf(
    (object: CreateUserDto): boolean =>
      (object.provider ?? AuthProvider.LOCAL) === AuthProvider.LOCAL,
  )
  @IsString({ message: i18nValidationMessage('validation.string') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.required') })
  @MinLength(USER_VALIDATION.PASSWORD_MIN_LENGTH, {
    message: i18nValidationMessage('validation.min_length'),
  })
  @MaxLength(USER_VALIDATION.PASSWORD_MAX_LENGTH, {
    message: i18nValidationMessage('validation.max_length'),
  })
  @Matches(USER_VALIDATION.PASSWORD_COMPLEXITY_REGEX, {
    message: i18nValidationMessage('users.validation.password_complexity'),
  })
  password?: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.USER })
  @IsOptional()
  @IsEnum(UserRole, { message: i18nValidationMessage('validation.enum') })
  role?: UserRole;

  @ApiPropertyOptional({ enum: AuthProvider, default: AuthProvider.LOCAL })
  @IsOptional()
  @IsEnum(AuthProvider, { message: i18nValidationMessage('validation.enum') })
  provider?: AuthProvider;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage('validation.boolean') })
  isActive?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage('validation.boolean') })
  isEmailVerified?: boolean;
}
