// src/common/limits/limits.module.ts
import { Global, Module } from '@nestjs/common';
import { LimitGuard } from './guards/limit.guard';
import { LimitSnapshotResolverService } from './services/limit-snapshot-resolver.service';
import { LimitService } from './services/limit.service';
import { GlobalLimitStrategy } from './strategies/global-limit.strategy';
import { LimitStrategyFactory } from './strategies/limit-strategy.factory';
import { ParentLimitStrategy } from './strategies/parent-limit.strategy';
import { TreeLimitStrategy } from './strategies/tree-limit.strategy';
import { UserLimitStrategy } from './strategies/user-limit.strategy';

@Global()
@Module({
  providers: [
    LimitGuard,
    LimitService,
    LimitSnapshotResolverService,
    LimitStrategyFactory,
    UserLimitStrategy,
    ParentLimitStrategy,
    GlobalLimitStrategy,
    TreeLimitStrategy,
  ],
  exports: [
    LimitGuard,
    LimitService,
    LimitSnapshotResolverService,
    LimitStrategyFactory,
    UserLimitStrategy,
    ParentLimitStrategy,
    GlobalLimitStrategy,
    TreeLimitStrategy,
  ],
})
export class LimitsModule {}
