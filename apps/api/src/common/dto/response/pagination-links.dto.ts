// src/common/dto/response/pagination-links.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class PaginationLinksDto {
  @ApiProperty({ nullable: true })
  previous!: string | null;

  @ApiProperty({ nullable: true })
  next!: string | null;

  @ApiProperty()
  first!: string;

  @ApiProperty()
  last!: string;

  constructor(
    previous: string | null,
    next: string | null,
    first: string,
    last: string,
  ) {
    this.previous = previous;
    this.next = next;
    this.first = first;
    this.last = last;
  }
}
