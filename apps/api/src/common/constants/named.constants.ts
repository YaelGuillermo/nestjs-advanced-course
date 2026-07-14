// src/common/constants/named.constants.ts
export const NAMED_CONFIG = {
  NAME_MIN_LENGTH: 3,
  NAME_MAX_LENGTH: 128,
  DESCRIPTION_MIN_LENGTH: 3,
  DESCRIPTION_MAX_LENGTH: 1024,
  NAME_REGEX: /^[\p{L}\p{N}\s._-]+$/u,
} as const;
