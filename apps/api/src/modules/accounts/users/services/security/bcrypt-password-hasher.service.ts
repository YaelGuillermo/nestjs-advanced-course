// src/modules/accounts/users/services/security/bcrypt-password-hasher.service.ts
import { Injectable } from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import { ConfigService } from 'src/config/config.service';
import type { IPasswordHasher } from './password-hasher.interface';

@Injectable()
export class BcryptPasswordHasherService implements IPasswordHasher {
  constructor(private readonly configService: ConfigService) {}

  hash(plainTextPassword: string): Promise<string> {
    return hash(
      plainTextPassword,
      this.configService.auth.passwordBcryptSaltRounds,
    );
  }

  compare(plainTextPassword: string, hashedPassword: string): Promise<boolean> {
    return compare(plainTextPassword, hashedPassword);
  }
}
