// src/modules/accounts/auth/dto/request/register.dto.ts
import { PickType } from '@nestjs/mapped-types';
import { CreateUserDto } from 'src/modules/accounts/users/dto/request/create-user.dto';

export class RegisterDto extends PickType(CreateUserDto, [
  'username',
  'email',
  'firstName',
  'lastName',
  'password',
] as const) {}
