// src/modules/accounts/users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from 'src/config/config.module';
import { StorageModule } from 'src/infrastructure/storage/storage.module';
import { UsersController } from './controllers/users.controller';
import { UserAvatar } from './entities/user-avatar.entity';
import { User } from './entities/user.entity';
import { UserPresenter } from './presentation/user.presenter';
import { UsersRepository } from './repositories/users.repository';
import { PASSWORD_HASHER, USERS_REPOSITORY } from './repositories/users.tokens';
import { BcryptPasswordHasherService } from './services/security/bcrypt-password-hasher.service';
import { UserAvatarsService } from './services/user-avatars.service';
import { UsersCommandService } from './services/users-command.service';
import { UsersQueryService } from './services/users-query.service';
import { UsersService } from './services/users.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User, UserAvatar]),
    StorageModule,
  ],
  controllers: [UsersController],
  providers: [
    UsersRepository,
    {
      provide: USERS_REPOSITORY,
      useExisting: UsersRepository,
    },
    {
      provide: PASSWORD_HASHER,
      useClass: BcryptPasswordHasherService,
    },
    UserPresenter,
    UserAvatarsService,
    UsersQueryService,
    UsersCommandService,
    UsersService,
  ],
  exports: [
    USERS_REPOSITORY,
    PASSWORD_HASHER,
    UserPresenter,
    UserAvatarsService,
    UsersQueryService,
    UsersCommandService,
    UsersService,
  ],
})
export class UsersModule {}
