// src/modules/accounts/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from 'src/config/config.module';
import { LoggingModule } from 'src/infrastructure/logging/logging.module';
//import { UsersModule } from 'src/modules/accounts/users/users.module';
import { AuthController } from './controllers/auth.controller';
import { GoogleAuthAccount } from './entities/google-auth-account.entity';
import { TokenBlacklist } from './entities/token-blacklist.entity';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { AuthPresenter } from './presentation/auth.presenter';
import { AuthCommandService } from './services/auth-command.service';
import { AuthValidationService } from './services/auth-validation.service';
import { AuthService } from './services/auth.service';
import { TokenBlacklistService } from './services/token-blacklist.service';
import { TokenService } from './services/token.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
  imports: [
    ConfigModule,
    LoggingModule,
    PassportModule.register({ session: false }),
    JwtModule.register({}),
    TypeOrmModule.forFeature([TokenBlacklist, GoogleAuthAccount]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthCommandService,
    AuthValidationService,
    TokenService,
    TokenBlacklistService,
    AuthPresenter,
    LocalStrategy,
    JwtStrategy,
    GoogleStrategy,
    LocalAuthGuard,
    JwtAuthGuard,
    GoogleAuthGuard,
  ],
  exports: [
    AuthService,
    AuthCommandService,
    AuthValidationService,
    TokenService,
    TokenBlacklistService,
    LocalAuthGuard,
    JwtAuthGuard,
    GoogleAuthGuard,
  ],
})
export class AuthModule {}
