// src/database/seeders/development-seed.config.ts
import { getFlagValue, hasFlag } from '../scripts/script-utils';

export interface DevelopmentSeedConfig {
  seed: number;
  users: number;
  rootPosts: number;
  minRepliesPerRoot: number;
  maxRepliesPerRoot: number;
  nestedReplyChance: number;
  followDensity: number;
  reactionsPerPost: number;
  imageChance: number;
  skipAvatars: boolean;
  skipImages: boolean;
}

const DEFAULT_DEVELOPMENT_SEED_CONFIG: DevelopmentSeedConfig = {
  seed: 20260517,
  users: 18,
  rootPosts: 45,
  minRepliesPerRoot: 1,
  maxRepliesPerRoot: 4,
  nestedReplyChance: 0.35,
  followDensity: 0.18,
  reactionsPerPost: 4,
  imageChance: 0.22,
  skipAvatars: false,
  skipImages: false,
};

function parseIntegerFlag(
  flag: string,
  fallback: number,
  options: { min?: number; max?: number } = {},
): number {
  const rawValue = getFlagValue(flag);

  if (rawValue === null) {
    return fallback;
  }

  const value = Number(rawValue);

  if (!Number.isInteger(value)) {
    throw new Error(`${flag} must be an integer.`);
  }

  if (options.min !== undefined && value < options.min) {
    throw new Error(`${flag} must be greater than or equal to ${options.min}.`);
  }

  if (options.max !== undefined && value > options.max) {
    throw new Error(`${flag} must be less than or equal to ${options.max}.`);
  }

  return value;
}

function parseFloatFlag(
  flag: string,
  fallback: number,
  options: { min?: number; max?: number } = {},
): number {
  const rawValue = getFlagValue(flag);

  if (rawValue === null) {
    return fallback;
  }

  const value = Number(rawValue);

  if (!Number.isFinite(value)) {
    throw new Error(`${flag} must be a valid number.`);
  }

  if (options.min !== undefined && value < options.min) {
    throw new Error(`${flag} must be greater than or equal to ${options.min}.`);
  }

  if (options.max !== undefined && value > options.max) {
    throw new Error(`${flag} must be less than or equal to ${options.max}.`);
  }

  return value;
}

export function createDevelopmentSeedConfigFromArgv(): DevelopmentSeedConfig {
  const config: DevelopmentSeedConfig = {
    seed: parseIntegerFlag('--seed', DEFAULT_DEVELOPMENT_SEED_CONFIG.seed, {
      min: 1,
    }),
    users: parseIntegerFlag('--users', DEFAULT_DEVELOPMENT_SEED_CONFIG.users, {
      min: 2,
      max: 500,
    }),
    rootPosts: parseIntegerFlag(
      '--root-posts',
      DEFAULT_DEVELOPMENT_SEED_CONFIG.rootPosts,
      { min: 1, max: 5_000 },
    ),
    minRepliesPerRoot: parseIntegerFlag(
      '--min-replies-per-root',
      DEFAULT_DEVELOPMENT_SEED_CONFIG.minRepliesPerRoot,
      { min: 0, max: 100 },
    ),
    maxRepliesPerRoot: parseIntegerFlag(
      '--max-replies-per-root',
      DEFAULT_DEVELOPMENT_SEED_CONFIG.maxRepliesPerRoot,
      { min: 0, max: 100 },
    ),
    nestedReplyChance: parseFloatFlag(
      '--nested-reply-chance',
      DEFAULT_DEVELOPMENT_SEED_CONFIG.nestedReplyChance,
      { min: 0, max: 1 },
    ),
    followDensity: parseFloatFlag(
      '--follow-density',
      DEFAULT_DEVELOPMENT_SEED_CONFIG.followDensity,
      { min: 0, max: 1 },
    ),
    reactionsPerPost: parseIntegerFlag(
      '--reactions-per-post',
      DEFAULT_DEVELOPMENT_SEED_CONFIG.reactionsPerPost,
      { min: 0, max: 500 },
    ),
    imageChance: parseFloatFlag(
      '--image-chance',
      DEFAULT_DEVELOPMENT_SEED_CONFIG.imageChance,
      { min: 0, max: 1 },
    ),
    skipAvatars: hasFlag('--skip-avatars'),
    skipImages: hasFlag('--skip-images'),
  };

  if (config.maxRepliesPerRoot < config.minRepliesPerRoot) {
    throw new Error(
      '--max-replies-per-root must be greater than or equal to --min-replies-per-root.',
    );
  }

  return config;
}
