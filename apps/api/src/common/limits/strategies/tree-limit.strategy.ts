// src/common/limits/strategies/tree-limit.strategy.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import type { ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm';
import { LIMIT_DEFAULTS, LIMIT_ERRORS } from '../constants/limit.constants';
import type {
  LimitConfig,
  LimitContext,
  LimitLevelRule,
  LimitSnapshot,
  LimitStrategy,
  TreeLimitConfig,
  TreeLimitContext,
} from '../types/limit.types';
import { resolveRemaining } from '../types/limit.types';
import {
  buildRawAlias,
  columnPath,
  deletedAtColumnPath,
  findColumnOrThrow,
  rawFallbackKeys,
  readRawValue,
} from '../utils/typeorm-limit.util';

type ParentInfo = {
  readonly depth: number;
  readonly scopeId: string | null;
};

@Injectable()
export class TreeLimitStrategy implements LimitStrategy {
  async getUsage<TEntity extends ObjectLiteral>(
    repository: Repository<TEntity>,
    config: LimitConfig,
    context: LimitContext,
  ): Promise<LimitSnapshot> {
    if (config.strategy !== 'tree' || context.kind !== 'tree') {
      throw new Error(
        'TreeLimitStrategy requires tree config and tree context.',
      );
    }

    const parentInfo = context.parentId
      ? await this.resolveParentInfo(repository, config, context.parentId)
      : { depth: 0, scopeId: null };

    const level = parentInfo.depth + 1;
    const maxDepth = config.maxDepth ?? null;
    const scopeId = context.scopeId ?? parentInfo.scopeId;

    if (maxDepth !== null && level > maxDepth) {
      return {
        current: 0,
        maximum: 0,
        remaining: 0,
        canCreate: false,
        strategy: 'tree',
        level,
        maxDepth,
        parentId: context.parentId,
        scopeField: config.scopeField ?? null,
        scopeId,
        reason: 'tree_depth_reached',
      };
    }

    const maximum = this.resolveMaximumForLevel(config, level);
    const current = await this.countDirectChildren(
      repository,
      config,
      context,
      scopeId,
    );

    return {
      current,
      maximum,
      remaining: resolveRemaining(maximum, current),
      canCreate: current < maximum,
      strategy: 'tree',
      level,
      maxDepth,
      parentId: context.parentId,
      scopeField: config.scopeField ?? null,
      scopeId,
      reason: current < maximum ? null : 'limit_reached',
    };
  }

  private async countDirectChildren<TEntity extends ObjectLiteral>(
    repository: Repository<TEntity>,
    config: TreeLimitConfig,
    context: TreeLimitContext,
    scopeId: string | null,
  ): Promise<number> {
    const alias = LIMIT_DEFAULTS.ENTITY_ALIAS;
    const parentField = config.parentField ?? LIMIT_DEFAULTS.PARENT_FIELD;

    let qb = repository.createQueryBuilder(alias);

    if (context.parentId) {
      qb = qb.where(
        `${columnPath(repository, alias, parentField)} = :parentId`,
        { parentId: context.parentId },
      );
    } else {
      qb = qb.where(`${columnPath(repository, alias, parentField)} IS NULL`);
    }

    qb = this.applyScope(repository, qb, config, scopeId);
    qb = qb.andWhere(
      `${deletedAtColumnPath(repository, config, alias)} IS NULL`,
    );

    return qb.getCount();
  }

  private async resolveParentInfo<TEntity extends ObjectLiteral>(
    repository: Repository<TEntity>,
    config: TreeLimitConfig,
    parentId: string,
  ): Promise<ParentInfo> {
    const parentField = config.parentField ?? LIMIT_DEFAULTS.PARENT_FIELD;
    const scopeField = config.scopeField;

    let currentParentId: string | null = parentId;
    let depth = 0;
    let scopeId: string | null = null;
    const visited = new Set<string>();

    while (currentParentId) {
      if (visited.has(currentParentId)) {
        throw new BadRequestException({
          ...LIMIT_ERRORS.PARENT_CONTEXT_NOT_RESOLVED,
          args: { field: parentField, reason: 'cycle_detected' },
        });
      }

      visited.add(currentParentId);

      const raw = await this.selectParentRaw(
        repository,
        config,
        currentParentId,
      );

      if (!raw) {
        throw new BadRequestException({
          ...LIMIT_ERRORS.PARENT_ENTITY_NOT_FOUND,
          args: { field: parentField, value: currentParentId },
        });
      }

      depth += 1;

      if (scopeField && scopeId === null) {
        scopeId = this.normalizeNullableString(raw[scopeField]);
      }

      currentParentId = this.normalizeNullableString(raw[parentField]);

      if (depth > LIMIT_DEFAULTS.MAX_TREE_SAFETY_DEPTH) {
        throw new BadRequestException({
          ...LIMIT_ERRORS.PARENT_CONTEXT_NOT_RESOLVED,
          args: { field: parentField, reason: 'max_depth_safety_reached' },
        });
      }
    }

    return { depth, scopeId };
  }

  private async selectParentRaw<TEntity extends ObjectLiteral>(
    repository: Repository<TEntity>,
    config: TreeLimitConfig,
    parentId: string,
  ): Promise<Record<string, unknown> | null> {
    const alias = LIMIT_DEFAULTS.ENTITY_ALIAS;
    const parentField = config.parentField ?? LIMIT_DEFAULTS.PARENT_FIELD;
    const parentColumn = findColumnOrThrow(repository, parentField);
    const parentAlias = buildRawAlias(parentField);

    let qb = repository
      .createQueryBuilder(alias)
      .select(columnPath(repository, alias, parentField), parentAlias)
      .where(
        `${columnPath(repository, alias, LIMIT_DEFAULTS.ID_FIELD)} = :parentId`,
        { parentId },
      )
      .andWhere(`${deletedAtColumnPath(repository, config, alias)} IS NULL`);

    if (config.scopeField) {
      const scopeAlias = buildRawAlias(config.scopeField);
      qb = qb.addSelect(
        columnPath(repository, alias, config.scopeField),
        scopeAlias,
      );
    }

    const raw = await qb.getRawOne<Record<string, unknown>>();

    if (!raw) {
      return null;
    }

    const normalized: Record<string, unknown> = {
      [parentField]: readRawValue(
        raw,
        rawFallbackKeys(alias, parentField, parentColumn),
      ),
    };

    if (config.scopeField) {
      const scopeColumn = findColumnOrThrow(repository, config.scopeField);
      normalized[config.scopeField] = readRawValue(
        raw,
        rawFallbackKeys(alias, config.scopeField, scopeColumn),
      );
    }

    return normalized;
  }

  private applyScope<TEntity extends ObjectLiteral>(
    repository: Repository<TEntity>,
    qb: SelectQueryBuilder<TEntity>,
    config: TreeLimitConfig,
    scopeId: string | null,
  ): SelectQueryBuilder<TEntity> {
    if (!config.scopeField) {
      return qb;
    }

    if (!scopeId) {
      throw new BadRequestException({
        ...LIMIT_ERRORS.PARENT_CONTEXT_NOT_RESOLVED,
        args: { field: config.scopeField },
      });
    }

    return qb.andWhere(
      `${columnPath(repository, LIMIT_DEFAULTS.ENTITY_ALIAS, config.scopeField)} = :scopeId`,
      { scopeId },
    );
  }

  private resolveMaximumForLevel(
    config: TreeLimitConfig,
    level: number,
  ): number {
    const specificRule = config.levelLimits?.find((rule) =>
      this.levelMatches(rule, level),
    );
    return specificRule?.maximum ?? config.maximum;
  }

  private levelMatches(rule: LimitLevelRule, level: number): boolean {
    if (typeof rule.level === 'number') {
      return rule.level === level;
    }

    const from = rule.fromLevel ?? Number.NEGATIVE_INFINITY;
    const to = rule.toLevel ?? Number.POSITIVE_INFINITY;

    return level >= from && level <= to;
  }

  private normalizeNullableString(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0 ? value : null;
  }
}
