// src/infrastructure/health/health.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from 'src/config/config.module';
import { StorageModule } from 'src/infrastructure/storage/storage.module';
import { HealthController } from './controllers/health.controller';
import { DatabaseHealthIndicator } from './indicators/database.health';
import { MemoryHealthIndicator } from './indicators/memory.health';
import { RedisHealthIndicator } from './indicators/redis.health';
import { StorageHealthIndicator } from './indicators/storage.health';
import { HealthService } from './services/health.service';

@Module({
  imports: [ConfigModule, StorageModule],
  controllers: [HealthController],
  providers: [
    HealthService,
    DatabaseHealthIndicator,
    RedisHealthIndicator,
    StorageHealthIndicator,
    MemoryHealthIndicator,
  ],
  exports: [
    HealthService,
    DatabaseHealthIndicator,
    RedisHealthIndicator,
    StorageHealthIndicator,
  ],
})
export class HealthModule {}
