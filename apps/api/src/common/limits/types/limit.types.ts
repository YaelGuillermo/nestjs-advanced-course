// src/common/limits/types/limit.types.ts
import type { ObjectLiteral, Repository } from 'typeorm';

export type LimitStrategyType = 'user' | 'parent' | 'global' | 'tree';
export type LimitFailureReason = 'limit_reached' | 'tree_depth_reached';

export interface LimitLevelRule {
  readonly level?: number;
  readonly fromLevel?: number;
  readonly toLevel?: number;
  readonly maximum: number;
}

interface BaseLimitConfig {
  readonly strategy: LimitStrategyType;
  readonly maximum: number;
  readonly deletedAtField?: string;
}

export interface UserLimitConfig extends BaseLimitConfig {
  readonly strategy: 'user';
  readonly userField?: string;
}

export interface ParentLimitConfig extends BaseLimitConfig {
  readonly strategy: 'parent';
  readonly parentField?: string;
}

export interface GlobalLimitConfig extends BaseLimitConfig {
  readonly strategy: 'global';
}

export interface TreeLimitConfig extends BaseLimitConfig {
  readonly strategy: 'tree';
  readonly parentField?: string;
  readonly scopeField?: string;
  readonly maxDepth?: number;
  readonly levelLimits?: readonly LimitLevelRule[];
}

export type LimitConfig =
  | UserLimitConfig
  | ParentLimitConfig
  | GlobalLimitConfig
  | TreeLimitConfig;

interface BaseLimitSnapshot {
  readonly current: number;
  readonly maximum: number;
  readonly remaining: number;
  readonly canCreate: boolean;
  readonly reason: LimitFailureReason | null;
}

export interface UserLimitSnapshot extends BaseLimitSnapshot {
  readonly strategy: 'user';
  readonly level: null;
  readonly maxDepth: null;
  readonly parentId: null;
  readonly scopeField: null;
  readonly scopeId: null;
}

export interface ParentLimitSnapshot extends BaseLimitSnapshot {
  readonly strategy: 'parent';
  readonly level: null;
  readonly maxDepth: null;
  readonly parentId: string;
  readonly scopeField: null;
  readonly scopeId: null;
}

export interface GlobalLimitSnapshot extends BaseLimitSnapshot {
  readonly strategy: 'global';
  readonly level: null;
  readonly maxDepth: null;
  readonly parentId: null;
  readonly scopeField: null;
  readonly scopeId: null;
}

export interface TreeLimitSnapshot extends BaseLimitSnapshot {
  readonly strategy: 'tree';
  readonly level: number;
  readonly maxDepth: number | null;
  readonly parentId: string | null;
  readonly scopeField: string | null;
  readonly scopeId: string | null;
}

export type LimitSnapshot =
  | UserLimitSnapshot
  | ParentLimitSnapshot
  | GlobalLimitSnapshot
  | TreeLimitSnapshot;

export interface UserLimitContext {
  readonly kind: 'user';
  readonly userId: string;
}

export interface ParentLimitContext {
  readonly kind: 'parent';
  readonly parentId: string;
}

export interface GlobalLimitContext {
  readonly kind: 'global';
}

export interface TreeLimitContext {
  readonly kind: 'tree';
  readonly parentId: string | null;
  readonly scopeId: string | null;
}

export type LimitContext =
  | UserLimitContext
  | ParentLimitContext
  | GlobalLimitContext
  | TreeLimitContext;

export interface LimitStrategy {
  getUsage<TEntity extends ObjectLiteral>(
    repository: Repository<TEntity>,
    config: LimitConfig,
    context: LimitContext,
  ): Promise<LimitSnapshot>;
}

export function resolveRemaining(maximum: number, current: number): number {
  return Math.max(0, maximum - current);
}

export function resolveLimitReason(
  maximum: number,
  current: number,
): LimitFailureReason | null {
  return current < maximum ? null : 'limit_reached';
}
