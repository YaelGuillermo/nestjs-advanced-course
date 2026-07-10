// src/infrastructure/health/indicators/redis.health.ts
import { Injectable } from '@nestjs/common';
import { Socket } from 'net';
import { ConfigService } from 'src/config/config.service';
import type { HealthIndicatorResult } from '../types/health.types';

@Injectable()
export class RedisHealthIndicator {
  readonly name = 'redis';

  constructor(private readonly configService: ConfigService) {}

  async check(includeDetails: boolean): Promise<HealthIndicatorResult> {
    const startedAt = performance.now();
    const redis = this.configService.redis;

    try {
      await this.pingTcp(redis.host, redis.port, redis.connectTimeoutMs);

      return {
        name: this.name,
        status: 'up',
        latencyMs: Math.round(performance.now() - startedAt),
        details: includeDetails
          ? {
              host: redis.host,
              port: redis.port,
              db: redis.db,
              keyPrefix: redis.keyPrefix,
            }
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
              host: redis.host,
              port: redis.port,
            }
          : undefined,
      };
    }
  }

  private pingTcp(
    host: string,
    port: number,
    timeoutMs: number,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = new Socket();

      socket.setTimeout(timeoutMs);
      socket.once('connect', () => {
        socket.destroy();
        resolve();
      });
      socket.once('timeout', () => {
        socket.destroy();
        reject(new Error(`Redis TCP timeout after ${timeoutMs}ms.`));
      });
      socket.once('error', (error) => {
        socket.destroy();
        reject(error);
      });

      socket.connect(port, host);
    });
  }
}
