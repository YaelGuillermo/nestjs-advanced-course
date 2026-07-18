// src/modules/accounts/users/constants/user.constants.ts
export const USER_SUCCESS = {
  LIST: {
    title: 'users.success.list.title',
    description: 'users.success.list.description',
  },
  FETCHED: {
    title: 'users.success.fetched.title',
    description: 'users.success.fetched.description',
  },
  CREATED: {
    title: 'users.success.created.title',
    description: 'users.success.created.description',
  },
  UPDATED: {
    title: 'users.success.updated.title',
    description: 'users.success.updated.description',
  },
  PASSWORD_UPDATED: {
    title: 'users.success.password_updated.title',
    description: 'users.success.password_updated.description',
  },
  DELETED: {
    title: 'users.success.deleted.title',
    description: 'users.success.deleted.description',
  },
  PAGINATION: {
    title: 'users.success.pagination.title',
    description: 'users.success.pagination.description',
  },
  HATEOAS: {
    title: 'users.success.hateoas.title',
    description: 'users.success.hateoas.description',
  },
} as const;

export const USER_ERRORS = {
  NOT_FOUND: {
    title: 'users.errors.not_found.title',
    description: 'users.errors.not_found.description',
  },
  USERNAME_ALREADY_EXISTS: {
    title: 'users.errors.username_already_exists.title',
    description: 'users.errors.username_already_exists.description',
  },
  EMAIL_ALREADY_EXISTS: {
    title: 'users.errors.email_already_exists.title',
    description: 'users.errors.email_already_exists.description',
  },
  PASSWORD_NOT_SET: {
    title: 'users.errors.password_not_set.title',
    description: 'users.errors.password_not_set.description',
  },
  PASSWORD_MISMATCH: {
    title: 'users.errors.password_mismatch.title',
    description: 'users.errors.password_mismatch.description',
  },
  PASSWORD_TOO_SHORT: {
    title: 'users.errors.password_too_short.title',
    description: 'users.errors.password_too_short.description',
  },
  OLD_PASSWORD_INCORRECT: {
    title: 'users.errors.old_password_incorrect.title',
    description: 'users.errors.old_password_incorrect.description',
  },
} as const;

export const USER_VALIDATION = {
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 32,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 64,
  EMAIL_MIN_LENGTH: 5,
  EMAIL_MAX_LENGTH: 128,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 72,

  USERNAME_REGEX: /^[a-z0-9_]+$/,
  EMAIL_LOWERCASE_REGEX: /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/,
  LOGIN_IDENTIFIER_REGEX:
    /^(?:[a-z0-9_]{3,32}|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})$/,

  PERSON_NAME_REGEX: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ]+(?:[ '-][a-zA-ZáéíóúÁÉÍÓÚñÑ]+)*$/,

  PASSWORD_COMPLEXITY_REGEX:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
} as const;

export const USER_MEDIA = {
  AVATAR_FIELD_NAME: 'avatar',
  AVATAR_FOLDER: 'users/avatars',
  AVATAR_MAX_FILES: 1,
} as const;
