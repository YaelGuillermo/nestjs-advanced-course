// src/common/interfaces/jwt-payload.interface.ts
export interface JwtPayload<TRole extends string = string> {
  sub: string;
  email: string;
  role: TRole;
  iat?: number;
  exp?: number;
}
