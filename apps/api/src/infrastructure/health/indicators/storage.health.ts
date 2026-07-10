// src/infrastructure/health/indicators/storage.health.ts
import { Injectable } from '@nestjs/common';
import { MediaStorageService } from 'src/infrastructure/storage/services/media-storage.service';
import type { HealthIndicatorResult } from '../types/health.types';

@Injectable()
export class StorageHealthIndicator {
  readonly name = 'storage';

  constructor(private readonly mediaStorageService: MediaStorageService) {}

  async check(includeDetails: boolean): Promise<HealthIndicatorResult> {
    const startedAt = performance.now();

    try {
      await this.mediaStorageService.assertHealthy();

      return {
        name: this.name,
        status: 'up',
        latencyMs: Math.round(performance.now() - startedAt),
        details: includeDetails
          ? this.mediaStorageService.getRuntimeDetails()
          : undefined,
      };
    } catch (error) {
      return {
        name: this.name,
        status: 'down',
        latencyMs: Math.round(performance.now() - startedAt),
        details: includeDetails
          ? {
              message: error instanceof Error ? error.message : String(error),
              driver: this.mediaStorageService.driver,
            }
          : undefined,
      };
    }
  }
}
