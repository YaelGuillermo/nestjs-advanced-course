// src/modules/accounts/users/serialization/user-serializer-group.mapper.ts
import {
  USERS_SERIALIZER_GROUPS,
  type UserAvatarGroup,
  type UserGroup,
} from './users.serializer-groups';

const USER_DETAIL_GROUPS = new Set<string>([
  USERS_SERIALIZER_GROUPS.USERS.DETAIL,
  USERS_SERIALIZER_GROUPS.USERS.ME,
]);

export function resolveUserAvatarGroupFromUserGroups(
  groups: readonly string[],
): UserAvatarGroup {
  return groups.some((group) => USER_DETAIL_GROUPS.has(group))
    ? USERS_SERIALIZER_GROUPS.USER_AVATAR.DETAIL
    : USERS_SERIALIZER_GROUPS.USER_AVATAR.MINIMAL;
}

export function resolveUserAvatarGroupFromUserGroup(
  group: UserGroup,
): UserAvatarGroup {
  return resolveUserAvatarGroupFromUserGroups([group]);
}
