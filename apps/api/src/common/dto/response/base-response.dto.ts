// src/common/dto/response/base-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ResponseMessageDto } from './message.dto';
import { PaginationLinksDto } from './pagination-links.dto';
import { PaginationMetaDto } from './pagination-meta.dto';

export class BaseResponseDto<TData = unknown> {
  @ApiProperty({ example: true })
  status!: boolean;

  @ApiProperty({ example: 200 })
  statusCode!: number;

  @ApiProperty({ example: '/api/v1/resources' })
  path!: string;

  @ApiProperty({ type: ResponseMessageDto })
  message!: ResponseMessageDto;

  @ApiProperty()
  data!: TData;

  @ApiPropertyOptional()
  pagination?: {
    meta: PaginationMetaDto;
    links: PaginationLinksDto;
  };

  @ApiProperty({ example: '2026-05-04T12:00:00.000Z' })
  timestamp!: string;
}
