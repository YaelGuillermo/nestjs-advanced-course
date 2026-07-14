// src/common/limits/services/limit.service.ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  type Type,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import 'reflect-metadata';
import type { ObjectLiteral, Repository } from 'typeorm';
import {
  LIMIT_DEFAULTS,
  LIMIT_ERRORS,
  LIMIT_METADATA_KEY,
} from '../constants/limit.constants';
import {
  LimitResource,
  type LimitableEntity,
} from '../decorators/limit-resource.decorator';
import { LimitStrategyFactory } from '../strategies/limit-strategy.factory';
import type {
  LimitConfig,
  LimitContext,
  LimitSnapshot,
  ParentLimitConfig,
  TreeLimitConfig,
} from '../types/limit.types';
import type { LimitRequest } from '../utils/limit-request.util';
import {
  readString,
  resolveAuthenticatedUserId,
} from '../utils/limit-request.util';

@Injectable()
export class LimitService {
  constructor(
    private readonly reflector: Reflector,
    private readonly strategyFactory: LimitStrategyFactory,
  ) {}

  getEntityFromContext(
    handler: Type<unknown> | Function,
    controller: Type<unknown>,
  ): LimitableEntity | null {
    return (
      this.reflector.getAllAndOverride(LimitResource, [handler, controller]) ??
      null
    );
  }

  getConfig(entity: LimitableEntity): LimitConfig | null {
    const config = Reflect.getMetadata(LIMIT_METADATA_KEY, entity);
    return isLimitConfig(config) ? config : null;
  }

  async getSnapshotForRequest<TEntity extends ObjectLiteral>(
    repository: Repository<TEntity>,
    entity: LimitableEntity,
    request: LimitRequest,
  ): Promise<LimitSnapshot | null> {
    const config = this.getConfig(entity);

    if (!config) {
      return null;
    }

    const context = this.resolveContext(config, request);
    const strategy = this.strategyFactory.getStrategy(config.strategy);

    return strategy.getUsage(repository, config, context);
  }

  assertCanConsume(snapshot: LimitSnapshot, units = 1): void {
    if (snapshot.reason === 'tree_depth_reached') {
      throw new ConflictException({
        ...LIMIT_ERRORS.TREE_DEPTH_REACHED,
        args: {
          level: snapshot.level,
          maxDepth: snapshot.maxDepth,
          requested: units,
        },
      });
    }

    if (snapshot.current + units <= snapshot.maximum) {
      return;
    }

    throw new ConflictException({
      ...LIMIT_ERRORS.LIMIT_REACHED,
      args: {
        maximum: snapshot.maximum,
        current: snapshot.current,
        remaining: snapshot.remaining,
        requested: units,
        strategy: snapshot.strategy,
        level: snapshot.level,
      },
    });
  }

  assertCanCreate(snapshot: LimitSnapshot, units = 1): void {
    this.assertCanConsume(snapshot, units);
  }

  private resolveContext(
    config: LimitConfig,
    request: LimitRequest,
  ): LimitContext {
    switch (config.strategy) {
      case 'user':
        return { kind: 'user', userId: this.resolveUserId(config, request) };
      case 'parent':
        return {
          kind: 'parent',
          parentId: this.resolveParentId(config, request),
        };
      case 'global':
        return { kind: 'global' };
      case 'tree':
        return {
          kind: 'tree',
          parentId: this.resolveOptionalParentId(config, request),
          scopeId: this.resolveOptionalScopeId(config, request),
        };
    }
  }

  private resolveUserId(config: LimitConfig, request: LimitRequest): string {
    const key =
      config.strategy === 'user'
        ? (config.userField ?? LIMIT_DEFAULTS.USER_FIELD)
        : LIMIT_DEFAULTS.USER_FIELD;

    const requestScopedUserId =
      readString(request.body, key) ??
      readString(request.params, key) ??
      readString(request.query, key);

    const userId = requestScopedUserId ?? resolveAuthenticatedUserId(request);

    if (!userId) {
      throw new BadRequestException({
        ...LIMIT_ERRORS.USER_CONTEXT_NOT_RESOLVED,
        args: { field: key },
      });
    }

    return userId;
  }

  private resolveParentId(
    config: ParentLimitConfig,
    request: LimitRequest,
  ): string {
    const key = config.parentField ?? LIMIT_DEFAULTS.PARENT_FIELD;
    const parentId =
      readString(request.body, key) ??
      readString(request.params, key) ??
      readString(request.query, key);

    if (!parentId) {
      throw new BadRequestException({
        ...LIMIT_ERRORS.PARENT_CONTEXT_NOT_RESOLVED,
        args: { field: key },
      });
    }

    return parentId;
  }

  private resolveOptionalParentId(
    config: TreeLimitConfig,
    request: LimitRequest,
  ): string | null {
    const key = config.parentField ?? LIMIT_DEFAULTS.PARENT_FIELD;
    return (
      readString(request.body, key) ??
      readString(request.params, key) ??
      readString(request.query, key)
    );
  }

  private resolveOptionalScopeId(
    config: TreeLimitConfig,
    request: LimitRequest,
  ): string | null {
    if (!config.scopeField) {
      return null;
    }

    return (
      readString(request.body, config.scopeField) ??
      readString(request.params, config.scopeField) ??
      readString(request.query, config.scopeField)
    );
  }
}

function isLimitConfig(value: unknown): value is LimitConfig {
  return (
    typeof value === 'object' &&
    value !== null &&
    'strategy' in value &&
    'maximum' in value
  );
}
