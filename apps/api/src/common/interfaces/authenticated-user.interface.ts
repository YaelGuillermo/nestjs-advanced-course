// src/common/interfaces/authenticated-user.interface.ts
export interface AuthenticatedUser<TRole extends string = string> {
  id: string;
  email: string;
  role: TRole;
}
