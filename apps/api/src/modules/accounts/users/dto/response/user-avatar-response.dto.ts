// src/modules/accounts/users/dto/response/user-avatar-response.dto.ts
import { Expose } from 'class-transformer';
import {
  ToIsoDate,
  ToNullableNumber,
  ToNullableString,
} from 'src/common/serialization/serialization-transformers';
import { serialize, serializeArray } from 'src/common/serialization/serialize';
import type { UserAvatar } from '../../entities/user-avatar.entity';
import type { UserAvatarGroup } from '../../serialization/users.serializer-groups';
import { USERS_SERIALIZER_GROUPS } from '../../serialization/users.serializer-groups';

const USER_AVATAR_COMMON_GROUPS: UserAvatarGroup[] = [
  USERS_SERIALIZER_GROUPS.USER_AVATAR.LIST,
  USERS_SERIALIZER_GROUPS.USER_AVATAR.MINIMAL,
  USERS_SERIALIZER_GROUPS.USER_AVATAR.DETAIL,
];

export class UserAvatarResponseDto {
  @Expose({ groups: USER_AVATAR_COMMON_GROUPS })
  id: string;

  @Expose({ groups: USER_AVATAR_COMMON_GROUPS })
  path: string;

  @Expose({ groups: USER_AVATAR_COMMON_GROUPS })
  publicPath: string;

  @Expose({ groups: USER_AVATAR_COMMON_GROUPS })
  @ToNullableString()
  publicUrl: string | null;

  @Expose({ groups: [USERS_SERIALIZER_GROUPS.USER_AVATAR.DETAIL] })
  originalName: string;

  @Expose({ groups: [USERS_SERIALIZER_GROUPS.USER_AVATAR.DETAIL] })
  mimeType: string;

  @Expose({ groups: [USERS_SERIALIZER_GROUPS.USER_AVATAR.DETAIL] })
  sizeBytes: string;

  @Expose({ groups: [USERS_SERIALIZER_GROUPS.USER_AVATAR.DETAIL] })
  extension: string;

  @Expose({ groups: USER_AVATAR_COMMON_GROUPS })
  @ToNullableNumber()
  width: number | null;

  @Expose({ groups: USER_AVATAR_COMMON_GROUPS })
  @ToNullableNumber()
  height: number | null;

  @Expose({ groups: [USERS_SERIALIZER_GROUPS.USER_AVATAR.DETAIL] })
  @ToNullableString()
  sourceUrl: string | null;

  @Expose({ groups: [USERS_SERIALIZER_GROUPS.USER_AVATAR.DETAIL] })
  @ToIsoDate()
  createdAt: string | null;

  @Expose({ groups: [USERS_SERIALIZER_GROUPS.USER_AVATAR.DETAIL] })
  @ToIsoDate()
  updatedAt: string | null;

  static from(
    entity: UserAvatar,
    group: UserAvatarGroup,
  ): UserAvatarResponseDto {
    return serialize(UserAvatarResponseDto, entity, { groups: [group] });
  }

  static fromMany(
    entities: readonly UserAvatar[],
    group: UserAvatarGroup,
  ): UserAvatarResponseDto[] {
    return serializeArray(UserAvatarResponseDto, entities, { groups: [group] });
  }
}
