// src/infrastructure/logging/services/app-logger.service.ts
import {
  ConsoleLogger,
  Injectable,
  type LogLevel as NestLogLevel,
} from '@nestjs/common';
import { ConfigService } from 'src/config/config.service';
import type {
  SerializableLogMessage,
  StructuredLogEntry,
} from '../types/logging.types';
import { normalizeLogMessage } from '../utils/log-message.util';
import { LogFileWriterService } from './log-file-writer.service';

@Injectable()
export class AppLogger extends ConsoleLogger {
  private currentContext: string | undefined;

  constructor(
    private readonly configService: ConfigService,
    private readonly fileWriter: LogFileWriterService,
  ) {
    super(configService.app.name, {
      timestamp: configService.observability.logTimestamp,
      logLevels: AppLogger.resolveLogLevels(
        configService.observability.logLevel,
      ),
      colors: configService.observability.logColorize,
    });

    this.currentContext = configService.app.name;
  }

  override setContext(context: string): void {
    this.currentContext = context;
    super.setContext(context);
  }

  override log(message: SerializableLogMessage, context?: string): void {
    const normalized = normalizeLogMessage(message);

    if (context) {
      super.log(normalized, context);
    } else {
      super.log(normalized);
    }

    this.persist('log', normalized, context);
  }

  override error(
    message: SerializableLogMessage,
    trace?: string,
    context?: string,
  ): void {
    const normalized = normalizeLogMessage(message);

    if (trace && context) {
      super.error(normalized, trace, context);
    } else if (trace) {
      super.error(normalized, trace);
    } else if (context) {
      super.error(normalized, undefined, context);
    } else {
      super.error(normalized);
    }

    this.persist('error', normalized, context, trace);
  }

  override warn(message: SerializableLogMessage, context?: string): void {
    const normalized = normalizeLogMessage(message);

    if (context) {
      super.warn(normalized, context);
    } else {
      super.warn(normalized);
    }

    this.persist('warn', normalized, context);
  }

  override debug(message: SerializableLogMessage, context?: string): void {
    const normalized = normalizeLogMessage(message);

    if (context) {
      super.debug(normalized, context);
    } else {
      super.debug(normalized);
    }

    this.persist('debug', normalized, context);
  }

  override verbose(message: SerializableLogMessage, context?: string): void {
    const normalized = normalizeLogMessage(message);

    if (context) {
      super.verbose(normalized, context);
    } else {
      super.verbose(normalized);
    }

    this.persist('verbose', normalized, context);
  }

  private persist(
    level: NestLogLevel,
    message: string,
    context?: string,
    trace?: string,
  ): void {
    const entry: StructuredLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      context: context ?? this.currentContext ?? this.configService.app.name,
      message,
      trace,
    };

    this.fileWriter.write(entry);
  }

  private static resolveLogLevels(logLevel: string): NestLogLevel[] {
    switch (logLevel) {
      case 'error':
        return ['error'];
      case 'warn':
        return ['error', 'warn'];
      case 'log':
        return ['error', 'warn', 'log'];
      case 'info':
        return ['error', 'warn', 'log'];
      case 'debug':
        return ['error', 'warn', 'log', 'debug'];
      case 'verbose':
        return ['error', 'warn', 'log', 'debug', 'verbose'];
      default:
        return ['error', 'warn', 'log'];
    }
  }
}
