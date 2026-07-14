// src/common/repositories/base.repository.ts
import {
  type ObjectLiteral,
  Repository,
  type SelectQueryBuilder,
} from 'typeorm';
import { DeletedScope } from '../enums/deleted-scope.enum';
import { SortOrder } from '../enums/sort-order.enum';
import type { BaseFilterDto } from '../filters/base-filter.dto';
import type { NormalizedPagination } from '../pagination/pagination.types';

export type SortDirection = 'ASC' | 'DESC';
export type SortMap = Readonly<Record<string, string>>;
export type DefaultSort = Readonly<{ column: string; order: SortDirection }>;

export abstract class BaseRepository<
  TEntity extends ObjectLiteral,
> extends Repository<TEntity> {
  protected abstract applySearch(
    qb: SelectQueryBuilder<TEntity>,
    search: string,
    alias: string,
  ): SelectQueryBuilder<TEntity>;

  protected abstract getSortMap(alias: string): SortMap;

  protected getDefaultSort(alias: string): DefaultSort {
    return { column: `${alias}.createdAt`, order: 'DESC' };
  }

  protected getTieBreakerSort(alias: string): string {
    return `${alias}.id`;
  }

  protected applyDeletedScope(
    qb: SelectQueryBuilder<TEntity>,
    filter: Pick<BaseFilterDto, 'deleted'>,
    alias: string,
  ): SelectQueryBuilder<TEntity> {
    const scope = filter.deleted ?? DeletedScope.ACTIVE;

    if (scope === DeletedScope.ACTIVE) {
      return qb;
    }

    qb.withDeleted();

    if (scope === DeletedScope.DELETED) {
      qb.andWhere(`${alias}.deletedAt IS NOT NULL`);
    }

    return qb;
  }

  protected applySorting(
    qb: SelectQueryBuilder<TEntity>,
    filter: Pick<BaseFilterDto, 'sortBy' | 'sortOrder'>,
    alias: string,
  ): SelectQueryBuilder<TEntity> {
    const sortMap = this.getSortMap(alias);
    const order: SortDirection =
      filter.sortOrder === SortOrder.ASC ? 'ASC' : 'DESC';
    const column = filter.sortBy ? sortMap[filter.sortBy] : undefined;

    if (column) {
      qb.orderBy(column, order);
    } else {
      const fallback = this.getDefaultSort(alias);
      qb.orderBy(fallback.column, fallback.order);
    }

    qb.addOrderBy(this.getTieBreakerSort(alias), 'ASC');

    return qb;
  }

  protected applyFilters(
    qb: SelectQueryBuilder<TEntity>,
    filter: BaseFilterDto,
    alias = 'entity',
  ): SelectQueryBuilder<TEntity> {
    this.applyDeletedScope(qb, filter, alias);

    const search = filter.search?.trim();

    if (search) {
      this.applySearch(qb, search, alias);
    }

    this.applySorting(qb, filter, alias);

    return qb;
  }

  protected applyPagination(
    qb: SelectQueryBuilder<TEntity>,
    pagination: NormalizedPagination,
  ): SelectQueryBuilder<TEntity>;

  protected applyPagination(
    qb: SelectQueryBuilder<TEntity>,
    page: number,
    limit: number,
  ): SelectQueryBuilder<TEntity>;

  protected applyPagination(
    qb: SelectQueryBuilder<TEntity>,
    pageOrPagination: number | NormalizedPagination,
    maybeLimit?: number,
  ): SelectQueryBuilder<TEntity> {
    const page =
      typeof pageOrPagination === 'number'
        ? pageOrPagination
        : pageOrPagination.page;
    const limit =
      typeof pageOrPagination === 'number'
        ? maybeLimit
        : pageOrPagination.limit;

    const safePage = Number.isInteger(page) && page > 0 ? page : 1;
    const safeLimit =
      Number.isInteger(limit) && Number(limit) > 0 ? Number(limit) : 1;

    return qb.skip((safePage - 1) * safeLimit).take(safeLimit);
  }
}
