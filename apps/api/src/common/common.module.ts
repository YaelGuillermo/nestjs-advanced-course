// src/common/common.module.ts
import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ConfigModule } from 'src/config/config.module';
import { ApiExceptionFilter } from './exception-filters/api-exception.filter';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { TimeoutInterceptor } from './interceptors/timeout.interceptor';
import { LimitsModule } from './limits/limits.module';
import { RequestIdMiddleware } from './middlewares/request-id.middleware';
import { PaginationService } from './pagination/pagination.service';
import { AppValidationPipe } from './pipes/app-validation.pipe';
import { ParseBooleanPipe } from './pipes/parse-boolean.pipe';
import { ParseIntPipe } from './pipes/parse-int.pipe';
import { ParseUUIDPipe } from './pipes/parse-uuid.pipe';
import { ApiResponseService } from './responses/api-response.service';
import { CollectionResponseService } from './responses/collection-response.service';
import { HateoasService } from './responses/hateoas.service';

@Global()
@Module({
  imports: [ConfigModule, LimitsModule],
  providers: [
    AppValidationPipe,

    ParseBooleanPipe,
    ParseIntPipe,
    ParseUUIDPipe,

    PaginationService,

    ApiResponseService,
    HateoasService,
    CollectionResponseService,

    ResponseInterceptor,
    TimeoutInterceptor,
    ApiExceptionFilter,

    RequestIdMiddleware,

    {
      provide: APP_PIPE,
      useExisting: AppValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useExisting: TimeoutInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useExisting: ResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useExisting: ApiExceptionFilter,
    },
  ],
  exports: [
    LimitsModule,

    AppValidationPipe,

    ParseBooleanPipe,
    ParseIntPipe,
    ParseUUIDPipe,

    PaginationService,

    ApiResponseService,
    HateoasService,
    CollectionResponseService,

    ResponseInterceptor,
    TimeoutInterceptor,
    ApiExceptionFilter,

    RequestIdMiddleware,
  ],
})
export class CommonModule {}
