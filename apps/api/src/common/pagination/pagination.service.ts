// src/common/pagination/pagination.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from 'src/config/config.service';
import type { PaginationMeta } from '../responses/response.types';
import type { NormalizedPagination, PaginationInput } from './pagination.types';

@Injectable()
export class PaginationService {
  constructor(private readonly configService: ConfigService) {}

  normalize(input: PaginationInput = {}): NormalizedPagination {
    const page = this.normalizePage(input.page ?? null);
    const limit = this.normalizeLimit(input.limit ?? null);

    return {
      page,
      limit,
      offset: (page - 1) * limit,
    };
  }

  buildMeta(
    page: number,
    limit: number,
    totalItems: number,
    count: number,
  ): PaginationMeta {
    const safePage = this.positiveIntegerOrDefault(page, 1);
    const safeLimit = this.positiveIntegerOrDefault(limit, 1);
    const safeTotalItems = this.nonNegativeIntegerOrDefault(totalItems, 0);
    const safeCount = this.nonNegativeIntegerOrDefault(count, 0);

    return {
      currentPage: safePage,
      totalPages: Math.max(1, Math.ceil(safeTotalItems / safeLimit)),
      totalItems: safeTotalItems,
      pageSize: safeLimit,
      count: safeCount,
    };
  }

  private normalizePage(value: number | null): number {
    return this.positiveIntegerOrDefault(
      value,
      this.configService.pagination.defaultPage,
    );
  }

  private normalizeLimit(value: number | null): number {
    const fallback = this.configService.pagination.defaultLimit;
    const max = this.configService.pagination.maxLimit;
    const limit = this.positiveIntegerOrDefault(value, fallback);

    return Math.min(limit, max);
  }

  private positiveIntegerOrDefault(value: unknown, fallback: number): number {
    return Number.isInteger(value) && Number(value) > 0
      ? Number(value)
      : fallback;
  }

  private nonNegativeIntegerOrDefault(
    value: unknown,
    fallback: number,
  ): number {
    return Number.isInteger(value) && Number(value) >= 0
      ? Number(value)
      : fallback;
  }
}
