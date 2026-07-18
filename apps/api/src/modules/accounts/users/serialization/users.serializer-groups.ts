// src/modules/accounts/users/serialization/users.serializer-groups.ts
export const USERS_SERIALIZER_GROUPS = {
  USERS: {
    LIST: 'users:list',
    DETAIL: 'users:detail',
    MINIMAL: 'users:minimal',
    ME: 'users:me',
  },
  USER_AVATAR: {
    LIST: 'user_avatar:list',
    DETAIL: 'user_avatar:detail',
    MINIMAL: 'user_avatar:minimal',
  },
} as const;

export type UserGroup =
  (typeof USERS_SERIALIZER_GROUPS.USERS)[keyof typeof USERS_SERIALIZER_GROUPS.USERS];

export type UserAvatarGroup =
  (typeof USERS_SERIALIZER_GROUPS.USER_AVATAR)[keyof typeof USERS_SERIALIZER_GROUPS.USER_AVATAR];

export type UsersGroup = UserGroup | UserAvatarGroup;

export const USER_RESPONSE_GROUPS = Object.values(
  USERS_SERIALIZER_GROUPS.USERS,
) as UserGroup[];

export const USER_AVATAR_RESPONSE_GROUPS = Object.values(
  USERS_SERIALIZER_GROUPS.USER_AVATAR,
) as UserAvatarGroup[];
