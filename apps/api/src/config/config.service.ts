// src/config/config.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import type {
  ApiConfig,
  AppConfig,
  AuthConfig,
  BehaviorConfig,
  DatabaseConfig,
  DevelopmentConfig,
  EmailConfig,
  FeaturesConfig,
  IntegrationsConfig,
  ObservabilityConfig,
  PaginationConfig,
  QueueConfig,
  RedisConfig,
  SecurityConfig,
  StorageConfig,
} from './types/config.types';

@Injectable()
export class ConfigService {
  constructor(private readonly config: NestConfigService) {}

  get nodeEnv(): AppConfig['nodeEnv'] {
    return this.app.nodeEnv;
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isTest(): boolean {
    return this.nodeEnv === 'test';
  }

  get app(): AppConfig {
    return this.getNamespace<AppConfig>('app');
  }

  get api(): ApiConfig {
    return this.getNamespace<ApiConfig>('api');
  }

  get pagination(): PaginationConfig {
    return this.getNamespace<PaginationConfig>('pagination');
  }

  get auth(): AuthConfig {
    return this.getNamespace<AuthConfig>('auth');
  }

  get security(): SecurityConfig {
    return this.getNamespace<SecurityConfig>('security');
  }

  get database(): DatabaseConfig {
    return this.getNamespace<DatabaseConfig>('database');
  }

  get redis(): RedisConfig {
    return this.getNamespace<RedisConfig>('redis');
  }

  get queue(): QueueConfig {
    return this.getNamespace<QueueConfig>('queue');
  }

  get email(): EmailConfig {
    return this.getNamespace<EmailConfig>('email');
  }

  get storage(): StorageConfig {
    return this.getNamespace<StorageConfig>('storage');
  }

  get observability(): ObservabilityConfig {
    return this.getNamespace<ObservabilityConfig>('observability');
  }

  get features(): FeaturesConfig {
    return this.getNamespace<FeaturesConfig>('features');
  }

  get integrations(): IntegrationsConfig {
    return this.getNamespace<IntegrationsConfig>('integrations');
  }

  get behavior(): BehaviorConfig {
    return this.getNamespace<BehaviorConfig>('behavior');
  }

  get development(): DevelopmentConfig {
    return this.getNamespace<DevelopmentConfig>('development');
  }

  get apiBasePath(): string {
    return `/${this.api.fullPrefix}`;
  }

  get swaggerPath(): string {
    return `${this.api.fullPrefix}/${this.features.swaggerPath}`;
  }

  get healthCheckPath(): string {
    return `${this.api.fullPrefix}/${this.features.healthCheckPath}`;
  }

  private getNamespace<T extends object>(key: string): T {
    return this.config.getOrThrow<T>(key);
  }
}
