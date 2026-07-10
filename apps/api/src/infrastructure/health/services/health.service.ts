// src/infrastructure/health/health.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from 'src/config/config.service';
import { DatabaseHealthIndicator } from '../indicators/database.health';
import { MemoryHealthIndicator } from '../indicators/memory.health';
import { RedisHealthIndicator } from '../indicators/redis.health';
import { StorageHealthIndicator } from '../indicators/storage.health';
import type {
  HealthCheckKind,
  HealthIndicatorResult,
  HealthReport,
} from '../types/health.types';

@Injectable()
export class HealthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly database: DatabaseHealthIndicator,
    private readonly redis: RedisHealthIndicator,
    private readonly storage: StorageHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
  ) {}

  async liveness(): Promise<HealthReport> {
    return this.buildReport('liveness', [
      await this.memory.check(this.includeDetails),
    ]);
  }

  async readiness(): Promise<HealthReport> {
    const checks = await Promise.all([
      this.database.check(this.includeDetails),
      this.redis.check(this.includeDetails),
      this.storage.check(this.includeDetails),
    ]);

    return this.buildReport('readiness', checks);
  }

  async full(): Promise<HealthReport> {
    const checks = await Promise.all([
      this.memory.check(this.includeDetails),
      this.database.check(this.includeDetails),
      this.redis.check(this.includeDetails),
      this.storage.check(this.includeDetails),
    ]);

    return this.buildReport('full', checks);
  }

  private get includeDetails(): boolean {
    return this.configService.features.healthCheckDetailsEnabled;
  }

  private buildReport(
    kind: HealthCheckKind,
    checks: HealthIndicatorResult[],
  ): HealthReport {
    const hasDownCheck = checks.some((check) => check.status === 'down');

    return {
      status: hasDownCheck ? 'error' : 'ok',
      kind,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      service: {
        name: this.configService.app.name,
        version: this.configService.app.version,
        nodeEnv: this.configService.app.nodeEnv,
      },
      checks,
    };
  }
}
