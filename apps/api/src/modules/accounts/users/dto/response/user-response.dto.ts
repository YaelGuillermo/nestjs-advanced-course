// src/modules/accounts/users/dto/response/user-response.dto.ts
import { Expose, Transform, type TransformFnParams } from 'class-transformer';
import {
  ToIsoDate,
  ToNullableNumber,
} from 'src/common/serialization/serialization-transformers';
import {
  getSerializationContext,
  serialize,
  serializeArray,
} from 'src/common/serialization/serialize';
import { isRecord } from 'src/common/utils/object.util';
import type { User } from '../../entities/user.entity';
import { AuthProvider } from '../../enums/auth-provider.enum';
import { UserRole } from '../../enums/user-role.enum';
import type { UserSerializationContext } from '../../serialization/user-serialization-context';
import { resolveUserAvatarGroupFromUserGroups } from '../../serialization/user-serializer-group.mapper';
import type { UserGroup } from '../../serialization/users.serializer-groups';
import { USERS_SERIALIZER_GROUPS } from '../../serialization/users.serializer-groups';
import { UserAvatarResponseDto } from './user-avatar-response.dto';

const USER_COMMON_GROUPS: UserGroup[] = [
  USERS_SERIALIZER_GROUPS.USERS.LIST,
  USERS_SERIALIZER_GROUPS.USERS.MINIMAL,
  USERS_SERIALIZER_GROUPS.USERS.DETAIL,
  USERS_SERIALIZER_GROUPS.USERS.ME,
];

const USER_DETAIL_GROUPS: UserGroup[] = [
  USERS_SERIALIZER_GROUPS.USERS.DETAIL,
  USERS_SERIALIZER_GROUPS.USERS.ME,
];

function getObjectId(value: unknown): string | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const id = value.id;

  return typeof id === 'string' ? id : undefined;
}

function serializeAvatar(
  value: unknown,
  groups?: string[],
): UserAvatarResponseDto | null {
  if (!isRecord(value)) {
    return null;
  }

  const group = resolveUserAvatarGroupFromUserGroups(groups ?? []);

  return serialize(UserAvatarResponseDto, value, {
    groups: [group],
  });
}

export class UserResponseDto {
  @Expose({ groups: USER_COMMON_GROUPS })
  id: string;

  @Expose({ groups: USER_COMMON_GROUPS })
  username: string;

  @Expose({ groups: USER_COMMON_GROUPS })
  firstName: string;

  @Expose({ groups: USER_COMMON_GROUPS })
  lastName: string;

  @Expose({ groups: USER_COMMON_GROUPS })
  email: string;

  @Expose({ groups: USER_COMMON_GROUPS })
  role: UserRole;

  @Expose({ groups: USER_DETAIL_GROUPS })
  provider: AuthProvider;

  @Expose({ groups: USER_DETAIL_GROUPS })
  isActive: boolean;

  @Expose({ groups: USER_DETAIL_GROUPS })
  isEmailVerified: boolean;

  @Expose({ groups: USER_DETAIL_GROUPS })
  @ToIsoDate()
  lastLoginAt: string | null;

  @Expose({ groups: USER_DETAIL_GROUPS })
  @Transform(
    ({ value, options }: TransformFnParams): UserAvatarResponseDto | null =>
      serializeAvatar(value, options.groups),
  )
  avatar: UserAvatarResponseDto | null;

  @Expose({ groups: USER_DETAIL_GROUPS })
  @ToNullableNumber()
  programsCount: number | null;

  @Expose({ groups: USER_DETAIL_GROUPS })
  @Transform(({ obj }: TransformFnParams): boolean => {
    const context = getSerializationContext<UserSerializationContext>(obj);

    return context?.actorId === getObjectId(obj);
  })
  isMe: boolean;

  @Expose({ groups: USER_DETAIL_GROUPS })
  @ToIsoDate()
  createdAt: string | null;

  @Expose({ groups: USER_DETAIL_GROUPS })
  @ToIsoDate()
  updatedAt: string | null;

  @Expose({ groups: [USERS_SERIALIZER_GROUPS.USERS.ME] })
  @ToIsoDate()
  deletedAt: string | null;

  static from(
    entity: User,
    group: UserGroup,
    context?: UserSerializationContext,
  ): UserResponseDto {
    return serialize(UserResponseDto, entity, { groups: [group], context });
  }

  static fromMany(
    entities: readonly User[],
    group: UserGroup,
    context?: UserSerializationContext,
  ): UserResponseDto[] {
    return serializeArray(UserResponseDto, entities, {
      groups: [group],
      context,
    });
  }
}
