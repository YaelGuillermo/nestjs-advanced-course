// src/common/limits/strategies/user-limit.strategy.ts
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
export class UserLimitStrategy implements LimitStrategy {
  async getUsage<TEntity extends ObjectLiteral>(
    repository: Repository<TEntity>,
    config: LimitConfig,
    context: LimitContext,
  ): Promise<LimitSnapshot> {
    if (config.strategy !== 'user' || context.kind !== 'user') {
      throw new Error(
        'UserLimitStrategy requires user config and user context.',
      );
    }

    const alias = LIMIT_DEFAULTS.ENTITY_ALIAS;
    const userField = config.userField ?? LIMIT_DEFAULTS.USER_FIELD;
    const maximum = config.maximum;

    const current = await repository
      .createQueryBuilder(alias)
      .where(`${columnPath(repository, alias, userField)} = :userId`, {
        userId: context.userId,
      })
      .andWhere(`${deletedAtColumnPath(repository, config, alias)} IS NULL`)
      .getCount();

    return {
      current,
      maximum,
      remaining: resolveRemaining(maximum, current),
      canCreate: current < maximum,
      strategy: 'user',
      level: null,
      maxDepth: null,
      parentId: null,
      scopeField: null,
      scopeId: null,
      reason: resolveLimitReason(maximum, current),
    };
  }
}
