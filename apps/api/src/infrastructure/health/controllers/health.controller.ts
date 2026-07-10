// src/infrastructure/health/controllers/health.controller.ts
import {
  Controller,
  Get,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from 'src/config/config.service';
import { HealthService } from '../services/health.service';
import type { HealthReport } from '../types/health.types';

@Controller('health')
export class HealthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly healthService: HealthService,
  ) {}

  @Get()
  async full(): Promise<HealthReport> {
    this.assertHealthChecksEnabled();

    const report = await this.healthService.full();
    this.throwIfUnhealthy(report);

    return report;
  }

  @Get('live')
  async live(): Promise<HealthReport> {
    this.assertHealthChecksEnabled();

    const report = await this.healthService.liveness();
    this.throwIfUnhealthy(report);

    return report;
  }

  @Get('ready')
  async ready(): Promise<HealthReport> {
    this.assertHealthChecksEnabled();

    const report = await this.healthService.readiness();
    this.throwIfUnhealthy(report);

    return report;
  }

  private assertHealthChecksEnabled(): void {
    if (!this.configService.features.healthChecksEnabled) {
      throw new NotFoundException({
        title: 'health.errors.disabled.title',
        description: 'health.errors.disabled.description',
      });
    }
  }

  private throwIfUnhealthy(report: HealthReport): void {
    if (report.status === 'error') {
      throw new ServiceUnavailableException(report);
    }
  }
}
