// src/infrastructure/health/indicators/database.health.ts
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { HealthIndicatorResult } from '../types/health.types';

@Injectable()
export class DatabaseHealthIndicator {
  readonly name = 'database';

  constructor(private readonly dataSource: DataSource) {}

  async check(includeDetails: boolean): Promise<HealthIndicatorResult> {
    const startedAt = performance.now();

    try {
      if (!this.dataSource.isInitialized) {
        return this.down(
          startedAt,
          includeDetails,
          'DataSource is not initialized.',
        );
      }

      await this.dataSource.query('SELECT 1 AS ok');

      return {
        name: this.name,
        status: 'up',
        latencyMs: Math.round(performance.now() - startedAt),
        details: includeDetails
          ? {
              type: this.dataSource.options.type,
              database:
                'database' in this.dataSource.options
                  ? this.dataSource.options.database
                  : undefined,
              schema:
                'schema' in this.dataSource.options
                  ? this.dataSource.options.schema
                  : undefined,
            }
          : undefined,
      };
    } catch (error) {
      return this.down(startedAt, includeDetails, error);
    }
  }

  private down(
    startedAt: number,
    includeDetails: boolean,
    error: unknown,
  ): HealthIndicatorResult {
    return {
      name: this.name,
      status: 'down',
      latencyMs: Math.round(performance.now() - startedAt),
      details: includeDetails ? this.serializeError(error) : undefined,
    };
  }

  private serializeError(error: unknown): { message: string } {
    return {
      message: error instanceof Error ? error.message : String(error),
    };
  }
}
