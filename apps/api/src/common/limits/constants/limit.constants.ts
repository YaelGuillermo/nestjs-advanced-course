// src/common/limits/constants/limit.constants.ts
export const LIMIT_METADATA_KEY = 'common:limits:config';
export const LIMIT_ACTION_METADATA_KEY = 'common:limits:action';
export const LIMIT_DYNAMIC_OPTIONS_METADATA_KEY =
  'common:limits:dynamic-options';

export const LIMIT_DEFAULTS = {
  ENTITY_ALIAS: 'entity',
  ID_FIELD: 'id',
  USER_FIELD: 'userId',
  PARENT_FIELD: 'parentId',
  DELETED_AT_FIELD: 'deletedAt',
  MAX_TREE_SAFETY_DEPTH: 1000,
} as const;

export const LIMIT_ERRORS = {
  USER_CONTEXT_NOT_RESOLVED: {
    title: 'common.errors.limit_context_user.title',
    description: 'common.errors.limit_context_user.description',
  },
  PARENT_CONTEXT_NOT_RESOLVED: {
    title: 'common.errors.limit_context_parent.title',
    description: 'common.errors.limit_context_parent.description',
  },
  PARENT_ENTITY_NOT_FOUND: {
    title: 'common.errors.limit_parent_entity_not_found.title',
    description: 'common.errors.limit_parent_entity_not_found.description',
  },
  LIMIT_REACHED: {
    title: 'common.errors.limit_reached.title',
    description: 'common.errors.limit_reached.description',
  },
  TREE_DEPTH_REACHED: {
    title: 'common.errors.limit_tree_depth_reached.title',
    description: 'common.errors.limit_tree_depth_reached.description',
  },
} as const;
