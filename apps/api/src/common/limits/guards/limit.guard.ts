// src/common/limits/guards/limit.guard.ts
import {
  BadRequestException,
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { PATH_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import {
  DataSource,
  type EntityTarget,
  type ObjectLiteral,
  type Repository,
} from 'typeorm';
import {
  LIMIT_ACTION_METADATA_KEY,
  LIMIT_DEFAULTS,
  LIMIT_DYNAMIC_OPTIONS_METADATA_KEY,
  LIMIT_ERRORS,
} from '../constants/limit.constants';
import { LimitAction } from '../enums/limit-action.enum';
import { LimitService } from '../services/limit.service';
import type {
  DynamicLimitOptions,
  DynamicLimitUnitStrategy,
} from '../types/dynamic-limit.types';
import type { LimitConfig } from '../types/limit.types';
import {
  attachResolvedLimitContext,
  hasStringValue,
  type LimitRequest,
  readString,
} from '../utils/limit-request.util';
import {
  buildRawAlias,
  columnPath,
  deletedAtColumnPath,
  findColumnOrThrow,
  rawFallbackKeys,
  readRawValue,
} from '../utils/typeorm-limit.util';

type ResolvedLimitAction = 'create' | 'dynamic' | 'collection-list' | 'skip';
type PathMetadata = string | string[] | undefined;

@Injectable()
export class LimitGuard implements CanActivate {
  constructor(
    private readonly dataSource: DataSource,
    private readonly limitService: LimitService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const handler = context.getHandler();
    const controller = context.getClass();
    const entity = this.limitService.getEntityFromContext(handler, controller);

    if (!entity) {
      return true;
    }

    const config = this.limitService.getConfig(entity);

    if (!config) {
      return true;
    }

    const request = context.switchToHttp().getRequest<LimitRequest>();
    const action = this.resolveLimitAction(context, request, config);

    if (action === 'skip') {
      return true;
    }

    const repository = this.dataSource.getRepository(
      entity as EntityTarget<ObjectLiteral>,
    );

    await this.hydrateContextFromEntityId(repository, config, request, action);

    const snapshot = await this.limitService.getSnapshotForRequest(
      repository,
      entity,
      request,
    );

    if (!snapshot) {
      return true;
    }

    if (action === 'collection-list') {
      request.__limits = snapshot;
      return true;
    }

    const units =
      action === 'dynamic'
        ? await this.resolveDynamicUnits(context, request, repository)
        : 1;
    this.limitService.assertCanConsume(snapshot, units);

    return true;
  }

  private resolveLimitAction(
    context: ExecutionContext,
    request: LimitRequest,
    config: LimitConfig,
  ): ResolvedLimitAction {
    const explicitAction = this.reflector.getAllAndOverride<LimitAction>(
      LIMIT_ACTION_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (
      explicitAction === LimitAction.SKIP ||
      explicitAction === LimitAction.RELEASE
    ) {
      return 'skip';
    }

    if (explicitAction === LimitAction.DYNAMIC) {
      return 'dynamic';
    }

    if (explicitAction === LimitAction.CREATE) {
      return 'create';
    }

    if (this.isImplicitCollectionListRequest(context, request)) {
      return this.shouldAttachCollectionLimits(config)
        ? 'collection-list'
        : 'skip';
    }

    if (this.isImplicitCreateRequest(context, request)) {
      return 'create';
    }

    return 'skip';
  }

  private shouldAttachCollectionLimits(config: LimitConfig): boolean {
    return config.strategy === 'user' || config.strategy === 'global';
  }

  private async hydrateContextFromEntityId<TEntity extends ObjectLiteral>(
    repository: Repository<TEntity>,
    config: LimitConfig,
    request: LimitRequest,
    action: ResolvedLimitAction,
  ): Promise<void> {
    if (action !== 'create' && action !== 'dynamic') {
      return;
    }

    if (config.strategy !== 'parent' && config.strategy !== 'tree') {
      return;
    }

    const entityId = readString(request.params, LIMIT_DEFAULTS.ID_FIELD);

    if (!entityId) {
      return;
    }

    const fieldsToHydrate = this.getHydratableFieldNames(config).filter(
      (field) => !hasStringValue(request, field),
    );

    if (!fieldsToHydrate.length) {
      return;
    }

    const raw = await this.selectEntityFields(
      repository,
      entityId,
      fieldsToHydrate,
    );

    if (!raw) {
      return;
    }

    for (const field of fieldsToHydrate) {
      const value = raw[field];

      if (typeof value === 'string' && value.trim().length > 0) {
        attachResolvedLimitContext(request, field, value);
      }
    }
  }

  private getHydratableFieldNames(config: LimitConfig): string[] {
    if (config.strategy === 'parent') {
      return [config.parentField ?? LIMIT_DEFAULTS.PARENT_FIELD];
    }

    if (config.strategy === 'tree') {
      return [
        config.parentField ?? LIMIT_DEFAULTS.PARENT_FIELD,
        config.scopeField,
      ].filter((field): field is string => typeof field === 'string');
    }

    return [];
  }

  private async selectEntityFields<TEntity extends ObjectLiteral>(
    repository: Repository<TEntity>,
    entityId: string,
    fields: readonly string[],
  ): Promise<Record<string, unknown> | null> {
    const alias = LIMIT_DEFAULTS.ENTITY_ALIAS;
    const uniqueFields = [...new Set(fields)];

    if (!uniqueFields.length) {
      return null;
    }

    let qb = repository
      .createQueryBuilder(alias)
      .select(
        columnPath(repository, alias, LIMIT_DEFAULTS.ID_FIELD),
        buildRawAlias(LIMIT_DEFAULTS.ID_FIELD),
      )
      .where(
        `${columnPath(repository, alias, LIMIT_DEFAULTS.ID_FIELD)} = :entityId`,
        { entityId },
      );

    if (repository.metadata.deleteDateColumn) {
      qb = qb.withDeleted();
    }

    const descriptors = uniqueFields.map((field) => {
      const column = findColumnOrThrow(repository, field);
      const rawAlias = buildRawAlias(field);

      qb = qb.addSelect(columnPath(repository, alias, field), rawAlias);

      return {
        field,
        keys: rawFallbackKeys(alias, field, column),
      };
    });

    const raw = await qb.getRawOne<Record<string, unknown>>();

    if (!raw) {
      return null;
    }

    return descriptors.reduce<Record<string, unknown>>((acc, descriptor) => {
      acc[descriptor.field] = readRawValue(raw, descriptor.keys);
      return acc;
    }, {});
  }

  private async resolveDynamicUnits<TEntity extends ObjectLiteral>(
    context: ExecutionContext,
    request: LimitRequest,
    repository: Repository<TEntity>,
  ): Promise<number> {
    const options =
      this.reflector.getAllAndOverride<DynamicLimitOptions>(
        LIMIT_DYNAMIC_OPTIONS_METADATA_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? {};

    const strategy = this.resolveDynamicStrategy(options, request);

    switch (strategy.type) {
      case 'fixed':
        return this.normalizeUnits(strategy.units);
      case 'linked-list':
        return this.countLinkedListUnits(repository, request, strategy);
      case 'direct-children':
        return this.countDirectChildrenUnits(repository, request, strategy);
    }
  }

  private resolveDynamicStrategy(
    options: DynamicLimitOptions,
    request: LimitRequest,
  ): DynamicLimitUnitStrategy {
    const defaultUnits = options.defaultUnits ?? 1;
    const modeField = options.modeField ?? 'mode';
    const modeSource = options.modeSource ?? 'query';
    const mode = readString(request[modeSource], modeField);

    if (mode && options.modeStrategies?.[mode]) {
      return options.modeStrategies[mode];
    }

    return { type: 'fixed', units: defaultUnits };
  }

  private async countLinkedListUnits<TEntity extends ObjectLiteral>(
    repository: Repository<TEntity>,
    request: LimitRequest,
    strategy: Extract<DynamicLimitUnitStrategy, { type: 'linked-list' }>,
  ): Promise<number> {
    const sourceId = readString(request.params, LIMIT_DEFAULTS.ID_FIELD);

    if (!sourceId) {
      return this.normalizeUnits(strategy.includeRoot === false ? 0 : 1);
    }

    const alias = LIMIT_DEFAULTS.ENTITY_ALIAS;
    const linkField = strategy.linkField;
    const includeRoot = strategy.includeRoot ?? true;
    const maxDepth = strategy.maxDepth ?? LIMIT_DEFAULTS.MAX_TREE_SAFETY_DEPTH;
    const linkColumn = findColumnOrThrow(repository, linkField);
    const linkRawAlias = buildRawAlias(linkField);

    let currentId: string | null = sourceId;
    let count = 0;
    let depth = 0;
    const visited = new Set<string>();

    while (currentId) {
      if (visited.has(currentId)) {
        throw new BadRequestException({
          ...LIMIT_ERRORS.PARENT_CONTEXT_NOT_RESOLVED,
          args: { field: linkField, reason: 'cycle_detected' },
        });
      }

      if (depth >= maxDepth) {
        throw new BadRequestException({
          ...LIMIT_ERRORS.PARENT_CONTEXT_NOT_RESOLVED,
          args: { field: linkField, reason: 'max_depth_safety_reached' },
        });
      }

      visited.add(currentId);
      depth += 1;

      const raw = await repository
        .createQueryBuilder(alias)
        .select(
          columnPath(repository, alias, LIMIT_DEFAULTS.ID_FIELD),
          buildRawAlias(LIMIT_DEFAULTS.ID_FIELD),
        )
        .addSelect(columnPath(repository, alias, linkField), linkRawAlias)
        .where(
          `${columnPath(repository, alias, LIMIT_DEFAULTS.ID_FIELD)} = :currentId`,
          { currentId },
        )
        .andWhere(`${deletedAtColumnPath(repository, {}, alias)} IS NULL`)
        .getRawOne<Record<string, unknown>>();

      if (!raw) {
        break;
      }

      count += 1;

      const nextId = readRawValue(
        raw,
        rawFallbackKeys(alias, linkField, linkColumn),
      );
      currentId =
        typeof nextId === 'string' && nextId.trim().length > 0 ? nextId : null;
    }

    return this.normalizeUnits(includeRoot ? count : Math.max(0, count - 1));
  }

  private async countDirectChildrenUnits<TEntity extends ObjectLiteral>(
    repository: Repository<TEntity>,
    request: LimitRequest,
    strategy: Extract<DynamicLimitUnitStrategy, { type: 'direct-children' }>,
  ): Promise<number> {
    const sourceId = readString(request.params, LIMIT_DEFAULTS.ID_FIELD);

    if (!sourceId) {
      return this.normalizeUnits(strategy.includeRoot === false ? 0 : 1);
    }

    const alias = LIMIT_DEFAULTS.ENTITY_ALIAS;
    const parentField = strategy.parentField ?? LIMIT_DEFAULTS.PARENT_FIELD;
    const includeRoot = strategy.includeRoot ?? true;

    const children = await repository
      .createQueryBuilder(alias)
      .where(`${columnPath(repository, alias, parentField)} = :sourceId`, {
        sourceId,
      })
      .andWhere(`${deletedAtColumnPath(repository, {}, alias)} IS NULL`)
      .getCount();

    return this.normalizeUnits(includeRoot ? children + 1 : children);
  }

  private normalizeUnits(units: number): number {
    return Number.isInteger(units) && units > 0 ? units : 1;
  }

  private isImplicitCreateRequest(
    context: ExecutionContext,
    request: LimitRequest,
  ): boolean {
    if (request.method !== 'POST') {
      return false;
    }

    const handlerPath = this.getHandlerPath(context);
    return handlerPath === null
      ? Object.keys(request.params ?? {}).length === 0
      : this.isRootHandlerPath(handlerPath);
  }

  private isImplicitCollectionListRequest(
    context: ExecutionContext,
    request: LimitRequest,
  ): boolean {
    if (request.method !== 'GET') {
      return false;
    }

    const handlerPath = this.getHandlerPath(context);
    return handlerPath === null
      ? Object.keys(request.params ?? {}).length === 0
      : this.isRootHandlerPath(handlerPath);
  }

  private getHandlerPath(context: ExecutionContext): string | null {
    const path = Reflect.getMetadata(
      PATH_METADATA,
      context.getHandler(),
    ) as PathMetadata;

    if (typeof path === 'string') {
      return path;
    }

    if (Array.isArray(path)) {
      return (
        path.find((item): item is string => typeof item === 'string') ?? null
      );
    }

    return null;
  }

  private isRootHandlerPath(path: string): boolean {
    return path.trim().replace(/^\/+/, '').replace(/\/+$/, '').length === 0;
  }
}
