// src/common/pagination/pagination.types.ts
export interface PaginationQuery {
  readonly page: number | null;
  readonly limit: number | null;
}

export type PaginationInput = Partial<PaginationQuery>;

export interface NormalizedPagination {
  readonly page: number;
  readonly limit: number;
  readonly offset: number;
}
