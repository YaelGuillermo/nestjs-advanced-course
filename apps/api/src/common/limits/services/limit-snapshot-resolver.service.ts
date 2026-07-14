// src/common/limits/services/limit-snapshot-resolver.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DataSource, type EntityTarget, type ObjectLiteral } from 'typeorm';
import type { LimitableEntity } from '../decorators/limit-resource.decorator';
import type { LimitSnapshot } from '../types/limit.types';
import type { LimitRequest } from '../utils/limit-request.util';
import { LimitService } from './limit.service';

@Injectable()
export class LimitSnapshotResolverService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly limitService: LimitService,
  ) {}

  async resolve<TEntity extends ObjectLiteral>(
    entity: LimitableEntity<TEntity>,
    request: LimitRequest,
  ): Promise<LimitSnapshot> {
    const repository = this.dataSource.getRepository(
      entity as EntityTarget<TEntity>,
    );
    const snapshot = await this.limitService.getSnapshotForRequest(
      repository,
      entity,
      request,
    );

    if (!snapshot) {
      throw new InternalServerErrorException({
        title: 'common.errors.limit_snapshot_not_resolved.title',
        description: 'common.errors.limit_snapshot_not_resolved.description',
      });
    }

    return snapshot;
  }

  async resolveOrNull<TEntity extends ObjectLiteral>(
    entity: LimitableEntity<TEntity>,
    request: LimitRequest,
  ): Promise<LimitSnapshot | null> {
    try {
      return await this.resolve(entity, request);
    } catch {
      return null;
    }
  }
}
