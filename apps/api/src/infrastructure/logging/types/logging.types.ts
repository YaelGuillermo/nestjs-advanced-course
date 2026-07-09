// src/infrastructure/logging/types/logging.types.ts
import type { LogLevel as NestLogLevel } from '@nestjs/common';

export type SerializableLogMessage =
  | string
  | number
  | boolean
  | bigint
  | null
  | undefined
  | Error
  | object;

export interface StructuredLogEntry {
  timestamp: string;
  level: NestLogLevel;
  context: string;
  message: string;
  trace?: string;
}
