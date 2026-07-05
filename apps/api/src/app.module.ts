// src/app.module.ts
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nJsonLoader,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import { join } from 'path';
import { CommonModule } from 'src/common/common.module';
import { ApiExceptionFilter } from 'src/common/exception-filters/api-exception.filter';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';
import { TimeoutInterceptor } from 'src/common/interceptors/timeout.interceptor';
import { RequestIdMiddleware } from 'src/common/middlewares/request-id.middleware';
import { ConfigModule } from 'src/config/config.module';
import { ConfigService } from 'src/config/config.service';
import { DatabaseModule } from 'src/database/database.module';
import { HealthModule } from 'src/infrastructure/health/health.module';
import { StorageModule } from 'src/infrastructure/storage/storage.module';
import { AccountsModule } from 'src/modules/accounts/accounts.module';
import { ThreadsModule } from 'src/modules/threads/threads.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggingModule } from './infrastructure/logging/logging.module';
import { HttpLoggerMiddleware } from './infrastructure/logging/middlewares/http-logger.middleware';

@Module({
  imports: [
    ConfigModule,
    LoggingModule,
    CommonModule,
    DatabaseModule,
    StorageModule,
    HealthModule,
    AccountsModule,
    ThreadsModule,
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loader: I18nJsonLoader,
      loaderOptions: {
        path: join(process.cwd(), 'src/i18n'),
        watch: false,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        new HeaderResolver(['x-lang']),
        AcceptLanguageResolver,
      ],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.security.throttleTtlSeconds * 1000,
          limit: config.security.throttleLimit,
        },
      ],
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: TimeoutInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  constructor(private readonly configService: ConfigService) {}

  configure(consumer: MiddlewareConsumer): void {
    const healthCheckPath = this.configService.features.healthCheckPath;
    const prefixedHealthCheckPath = this.configService.healthCheckPath;
    const metricsPath = this.configService.observability.metricsPath;

    consumer
      .apply(RequestIdMiddleware, HttpLoggerMiddleware)
      .exclude(
        { path: healthCheckPath, method: RequestMethod.ALL },
        { path: prefixedHealthCheckPath, method: RequestMethod.ALL },
        { path: metricsPath, method: RequestMethod.ALL },
      )
      .forRoutes({ path: '*path', method: RequestMethod.ALL });
  }
}
