// src/modules/accounts/users/utils/user-password.util.ts
import { BadRequestException } from '@nestjs/common';
import { USER_ERRORS } from '../constants/user.constants';

export function assertPasswordsMatch(
  password: string,
  confirmation: string,
): void {
  if (password !== confirmation) {
    throw new BadRequestException(USER_ERRORS.PASSWORD_MISMATCH);
  }
}
