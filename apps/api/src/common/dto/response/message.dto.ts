// src/common/dto/response/message.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class ResponseMessageDto {
  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty({ example: 12 })
  durationMs!: number;

  constructor(title: string, description: string, durationMs: number) {
    this.title = title;
    this.description = description;
    this.durationMs = durationMs;
  }
}
