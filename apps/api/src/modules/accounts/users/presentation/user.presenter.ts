// src/modules/accounts/users/presentation/user.presenter.ts
import { Injectable } from '@nestjs/common';
import { UserResponseDto } from '../dto/response/user-response.dto';
import type { User } from '../entities/user.entity';
import type { UserSerializationContext } from '../serialization/user-serialization-context';
import { USERS_SERIALIZER_GROUPS } from '../serialization/users.serializer-groups';

@Injectable()
export class UserPresenter {
  list(
    users: readonly User[],
    context?: UserSerializationContext,
  ): UserResponseDto[] {
    return UserResponseDto.fromMany(
      users,
      USERS_SERIALIZER_GROUPS.USERS.LIST,
      context,
    );
  }

  minimal(
    users: readonly User[],
    context?: UserSerializationContext,
  ): UserResponseDto[] {
    return UserResponseDto.fromMany(
      users,
      USERS_SERIALIZER_GROUPS.USERS.MINIMAL,
      context,
    );
  }

  detail(user: User, context?: UserSerializationContext): UserResponseDto {
    return UserResponseDto.from(
      user,
      USERS_SERIALIZER_GROUPS.USERS.DETAIL,
      context,
    );
  }

  me(user: User, context?: UserSerializationContext): UserResponseDto {
    return UserResponseDto.from(
      user,
      USERS_SERIALIZER_GROUPS.USERS.ME,
      context,
    );
  }
}
