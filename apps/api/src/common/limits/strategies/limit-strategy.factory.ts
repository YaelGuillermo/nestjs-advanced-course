// src/common/limits/strategies/limit-strategy.factory.ts
import { Injectable } from '@nestjs/common';
import type { LimitStrategy, LimitStrategyType } from '../types/limit.types';
import { GlobalLimitStrategy } from './global-limit.strategy';
import { ParentLimitStrategy } from './parent-limit.strategy';
import { TreeLimitStrategy } from './tree-limit.strategy';
import { UserLimitStrategy } from './user-limit.strategy';

@Injectable()
export class LimitStrategyFactory {
  constructor(
    private readonly userStrategy: UserLimitStrategy,
    private readonly parentStrategy: ParentLimitStrategy,
    private readonly globalStrategy: GlobalLimitStrategy,
    private readonly treeStrategy: TreeLimitStrategy,
  ) {}

  getStrategy(strategy: LimitStrategyType): LimitStrategy {
    switch (strategy) {
      case 'user':
        return this.userStrategy;
      case 'parent':
        return this.parentStrategy;
      case 'global':
        return this.globalStrategy;
      case 'tree':
        return this.treeStrategy;
    }
  }
}
