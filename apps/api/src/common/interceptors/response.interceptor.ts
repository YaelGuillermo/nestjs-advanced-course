// src/common/interceptors/response.interceptor.ts
import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Response } from 'express';
import { map, type Observable } from 'rxjs';
import {
  RESPONSE_ENVELOPE_OPTIONS_METADATA,
  type ResponseEnvelopeOptions,
} from '../decorators/response-envelope-options.decorator';
import {
  RESPONSE_MESSAGE_METADATA,
  type ResponseMessageMetadata,
} from '../decorators/response-message.decorator';
import { SKIP_RESPONSE_INTERCEPTOR_METADATA } from '../decorators/skip-response-interceptor.decorator';
import { Lang } from '../enums/lang.enum';
import { ApiResponseService } from '../responses/api-response.service';
import type {
  ApiSuccessResponse,
  RequestWithResponseMeta,
} from '../responses/response.types';

@Injectable()
export class ResponseInterceptor implements NestInterceptor<
  unknown,
  ApiSuccessResponse<unknown>
> {
  constructor(
    private readonly reflector: Reflector,
    private readonly apiResponseService: ApiResponseService,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<ApiSuccessResponse<unknown>> {
    if (this.shouldSkipResponseEnvelope(context)) {
      return next.handle() as Observable<ApiSuccessResponse<unknown>>;
    }

    return next.handle().pipe(
      map((data: unknown): ApiSuccessResponse<unknown> => {
        const http = context.switchToHttp();
        const request = http.getRequest<RequestWithResponseMeta>();
        const response = http.getResponse<Response>();

        if (response.headersSent || response.writableEnded) {
          return data as ApiSuccessResponse<unknown>;
        }

        const locale = request.i18nLang || Lang.EN;
        response.setHeader('Content-Language', locale);

        return this.apiResponseService.createSuccess(
          request,
          response.statusCode,
          data,
          this.getResponseMessage(context),
          this.getResponseEnvelopeOptions(context),
        );
      }),
    );
  }

  private shouldSkipResponseEnvelope(context: ExecutionContext): boolean {
    return (
      this.reflector.getAllAndOverride<boolean>(
        SKIP_RESPONSE_INTERCEPTOR_METADATA,
        [context.getHandler(), context.getClass()],
      ) ?? false
    );
  }

  private getResponseMessage(
    context: ExecutionContext,
  ): ResponseMessageMetadata | undefined {
    return this.reflector.get<ResponseMessageMetadata | undefined>(
      RESPONSE_MESSAGE_METADATA,
      context.getHandler(),
    );
  }

  private getResponseEnvelopeOptions(
    context: ExecutionContext,
  ): ResponseEnvelopeOptions | undefined {
    return this.reflector.getAllAndOverride<
      ResponseEnvelopeOptions | undefined
    >(RESPONSE_ENVELOPE_OPTIONS_METADATA, [
      context.getHandler(),
      context.getClass(),
    ]);
  }
}
