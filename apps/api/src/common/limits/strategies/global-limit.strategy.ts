// src/common/limits/strategies/global-limit.strategy.ts
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
import { deletedAtColumnPath } from '../utils/typeorm-limit.util';

@Injectable()
export class GlobalLimitStrategy implements LimitStrategy {
  async getUsage<TEntity extends ObjectLiteral>(
    repository: Repository<TEntity>,
    config: LimitConfig,
    context: LimitContext,
  ): Promise<LimitSnapshot> {
    if (config.strategy !== 'global' || context.kind !== 'global') {
      throw new Error(
        'GlobalLimitStrategy requires global config and global context.',
      );
    }

    const alias = LIMIT_DEFAULTS.ENTITY_ALIAS;
    const maximum = config.maximum;

    const current = await repository
      .createQueryBuilder(alias)
      .where(`${deletedAtColumnPath(repository, config, alias)} IS NULL`)
      .getCount();

    return {
      current,
      maximum,
      remaining: resolveRemaining(maximum, current),
      canCreate: current < maximum,
      strategy: 'global',
      level: null,
      maxDepth: null,
      parentId: null,
      scopeField: null,
      scopeId: null,
      reason: resolveLimitReason(maximum, current),
    };
  }
}
