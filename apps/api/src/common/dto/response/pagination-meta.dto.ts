// src/common/dto/response/pagination-meta.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  currentPage!: number;

  @ApiProperty({ example: 10 })
  totalPages!: number;

  @ApiProperty({ example: 198 })
  totalItems!: number;

  @ApiProperty({ example: 20 })
  pageSize!: number;

  @ApiProperty({ example: 20 })
  count!: number;

  constructor(
    currentPage: number,
    totalPages: number,
    totalItems: number,
    pageSize: number,
    count: number,
  ) {
    this.currentPage = currentPage;
    this.totalPages = totalPages;
    this.totalItems = totalItems;
    this.pageSize = pageSize;
    this.count = count;
  }
}
