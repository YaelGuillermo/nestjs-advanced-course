// src/modules/accounts/auth/interfaces/auth-jwt-payload.interface.ts
import type { UserRole } from 'src/modules/accounts/users/enums/user-role.enum';

export interface AuthJwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}
