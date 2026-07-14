// src/common/limits/strategies/parent-limit.strategy.ts
import { Injectable } from '@nestjs/common';
import type { ObjectLiteral, Repository } from 'typeorm';
import { LIMIT_DEFAULTS } from '../constants/limit.constants';
import type {
  LimitConfig,
  LimitContext,
  LimitSnapshot,
  LimitStrategy,
} from '../types/limit.types';
import { resolveLimitReason, resolveRemaining } from '../types/limit.types';
import { columnPath, deletedAtColumnPath } from '../utils/typeorm-limit.util';

@Injectable()
export class ParentLimitStrategy implements LimitStrategy {
  async getUsage<TEntity extends ObjectLiteral>(
    repository: Repository<TEntity>,
    config: LimitConfig,
    context: LimitContext,
  ): Promise<LimitSnapshot> {
    if (config.strategy !== 'parent' || context.kind !== 'parent') {
      throw new Error(
        'ParentLimitStrategy requires parent config and parent context.',
      );
    }

    const alias = LIMIT_DEFAULTS.ENTITY_ALIAS;
    const parentField = config.parentField ?? LIMIT_DEFAULTS.PARENT_FIELD;
    const maximum = config.maximum;

    const current = await repository
      .createQueryBuilder(alias)
      .where(`${columnPath(repository, alias, parentField)} = :parentId`, {
        parentId: context.parentId,
      })
      .andWhere(`${deletedAtColumnPath(repository, config, alias)} IS NULL`)
      .getCount();

    return {
      current,
      maximum,
      remaining: resolveRemaining(maximum, current),
      canCreate: current < maximum,
      strategy: 'parent',
      level: null,
      maxDepth: null,
      parentId: context.parentId,
      scopeField: null,
      scopeId: null,
      reason: resolveLimitReason(maximum, current),
    };
  }
}
