// src/infrastructure/health/indicators/memory.health.ts
import { Injectable } from '@nestjs/common';
import type { HealthIndicatorResult } from '../types/health.types';

@Injectable()
export class MemoryHealthIndicator {
  readonly name = 'memory';

  async check(includeDetails: boolean): Promise<HealthIndicatorResult> {
    const startedAt = performance.now();
    const usage = process.memoryUsage();

    return {
      name: this.name,
      status: 'up',
      latencyMs: Math.round(performance.now() - startedAt),
      details: includeDetails
        ? {
            rssBytes: usage.rss,
            heapTotalBytes: usage.heapTotal,
            heapUsedBytes: usage.heapUsed,
            externalBytes: usage.external,
            arrayBuffersBytes: usage.arrayBuffers,
          }
        : undefined,
    };
  }
}
