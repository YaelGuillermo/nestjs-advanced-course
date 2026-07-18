// src/modules/accounts/users/services/security/password-hasher.interface.ts
export interface IPasswordHasher {
  hash(plainTextPassword: string): Promise<string>;
  compare(plainTextPassword: string, hashedPassword: string): Promise<boolean>;
}
