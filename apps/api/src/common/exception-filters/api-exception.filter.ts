// src/common/exception-filters/api-exception.filter.ts
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import type { Response } from 'express';
import { I18nService, I18nValidationException } from 'nestjs-i18n';
import {
  COMMON_ERROR_MESSAGES,
  getDefaultErrorCode,
  getDefaultErrorMessage,
} from '../constants/common-message.constants';
import { AppException } from '../exceptions/app.exception';
import { ApiResponseService } from '../responses/api-response.service';
import type {
  ApiErrorKind,
  ApiErrors,
  MessageTemplate,
  RequestWithResponseMeta,
} from '../responses/response.types';
import { resolveRequestLocale } from '../responses/response.util';
import {
  appendBusinessFailure,
  appendFailure,
  appendFieldFailure,
  appendSystemFailure,
  extractValidationErrors,
  flattenValidationErrors,
  GENERAL_ERROR_PATH,
  getI18nFailureCode,
  getParsedI18nProperty,
  hasApiErrors,
  isApiErrors,
  isValidationI18nMessage,
  normalizeConstraintCode,
  parseI18nMessage,
  SYSTEM_ERROR_PATH,
} from '../responses/validation-error.util';
import { isRecord } from '../utils/object.util';

interface NormalizedException {
  statusCode: number;
  message: MessageTemplate;
  errors?: ApiErrors;
}

@Catch()
@Injectable()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  constructor(
    private readonly apiResponseService: ApiResponseService,
    private readonly i18n: I18nService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<RequestWithResponseMeta>();

    if (response.headersSent || response.writableEnded) {
      return;
    }

    const normalized = this.normalizeException(exception, request);

    if (normalized.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logUnhandledException(exception, request);
    }

    response
      .status(normalized.statusCode)
      .json(
        this.apiResponseService.createError(
          request,
          normalized.statusCode,
          normalized.message,
          normalized.errors,
        ),
      );
  }

  private normalizeException(
    exception: unknown,
    request: RequestWithResponseMeta,
  ): NormalizedException {
    const lang = resolveRequestLocale(request);

    if (exception instanceof AppException) {
      return this.normalizeAppException(exception, request, lang);
    }

    if (exception instanceof I18nValidationException) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: COMMON_ERROR_MESSAGES.VALIDATION,
        errors: this.buildValidationErrorsOrGeneral(
          exception.errors ?? [],
          lang,
          request,
        ),
      };
    }

    if (exception instanceof HttpException) {
      return this.normalizeHttpException(exception, request, lang);
    }

    return this.normalizeUnknownException(exception, request, lang);
  }

  private normalizeAppException(
    exception: AppException,
    request: RequestWithResponseMeta,
    lang: string,
  ): NormalizedException {
    const statusCode = exception.getStatus();

    const normalizedErrors = this.normalizeApiErrors(
      exception.errors,
      lang,
      request,
    );

    if (normalizedErrors) {
      return {
        statusCode,
        message: exception.messageTemplate,
        errors: normalizedErrors,
      };
    }

    return {
      statusCode,
      message: exception.messageTemplate,
      errors: this.buildSingleErrorFromTemplate(
        exception.errorPath,
        exception.code ?? getDefaultErrorCode(statusCode),
        exception.messageTemplate,
        lang,
        exception.kind,
      ),
    };
  }

  private normalizeHttpException(
    exception: HttpException,
    request: RequestWithResponseMeta,
    lang: string,
  ): NormalizedException {
    const statusCode = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const validationErrors = extractValidationErrors(
      exception,
      exceptionResponse,
    );

    if (validationErrors) {
      return {
        statusCode,
        message: COMMON_ERROR_MESSAGES.VALIDATION,
        errors: this.buildValidationErrorsOrGeneral(
          validationErrors,
          lang,
          request,
        ),
      };
    }

    if (typeof exceptionResponse === 'string') {
      const message = getDefaultErrorMessage(statusCode);

      return {
        statusCode,
        message,
        errors: this.buildHttpGeneralErrors(
          statusCode,
          exceptionResponse,
          lang,
        ),
      };
    }

    if (isRecord(exceptionResponse)) {
      return this.normalizeHttpExceptionObject(
        statusCode,
        exceptionResponse,
        lang,
        request,
      );
    }

    return this.buildDefaultHttpException(statusCode, lang);
  }

  private normalizeHttpExceptionObject(
    statusCode: number,
    exceptionResponse: Record<string, unknown>,
    lang: string,
    request: RequestWithResponseMeta,
  ): NormalizedException {
    const rawMessage = exceptionResponse.message;

    const providedErrors = this.normalizeApiErrors(
      exceptionResponse.errors,
      lang,
      request,
    );

    if (this.isMessageTemplate(rawMessage)) {
      return {
        statusCode,
        message: rawMessage,
        errors:
          providedErrors ??
          this.buildSingleErrorFromTemplate(
            this.resolveDefaultErrorPath(statusCode),
            getDefaultErrorCode(statusCode),
            rawMessage,
            lang,
            this.resolveDefaultErrorKind(statusCode),
          ),
      };
    }

    if (typeof rawMessage === 'string') {
      const isValidationMessage = isValidationI18nMessage(rawMessage);

      return {
        statusCode,
        message: isValidationMessage
          ? COMMON_ERROR_MESSAGES.VALIDATION
          : getDefaultErrorMessage(statusCode),
        errors:
          providedErrors ??
          this.buildHttpGeneralErrors(statusCode, rawMessage, lang),
      };
    }

    if (
      Array.isArray(rawMessage) &&
      rawMessage.every((item) => typeof item === 'string')
    ) {
      const hasValidationMessages = rawMessage.some(isValidationI18nMessage);

      return {
        statusCode,
        message: hasValidationMessages
          ? COMMON_ERROR_MESSAGES.VALIDATION
          : getDefaultErrorMessage(statusCode),
        errors:
          providedErrors ??
          this.buildStringMessageErrors(
            rawMessage,
            lang,
            hasValidationMessages,
          ),
      };
    }

    return {
      statusCode,
      message: getDefaultErrorMessage(statusCode),
      errors:
        providedErrors ??
        this.buildSingleErrorFromTemplate(
          this.resolveDefaultErrorPath(statusCode),
          getDefaultErrorCode(statusCode),
          getDefaultErrorMessage(statusCode),
          lang,
          this.resolveDefaultErrorKind(statusCode),
        ),
    };
  }

  private normalizeUnknownException(
    exception: unknown,
    request: RequestWithResponseMeta,
    lang: string,
  ): NormalizedException {
    const statusCode =
      this.getExceptionStatusCode(exception) ??
      HttpStatus.INTERNAL_SERVER_ERROR;

    const message = getDefaultErrorMessage(statusCode);

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      return {
        statusCode,
        message,
        errors: this.buildSingleErrorFromTemplate(
          SYSTEM_ERROR_PATH,
          getDefaultErrorCode(statusCode),
          message,
          lang,
          'system',
        ),
      };
    }

    const rawMessage = this.getExceptionMessage(exception);

    const translatedMessage = rawMessage
      ? this.translateMaybeI18nMessage(rawMessage, lang)
      : this.translateTemplateDescription(message, lang);

    return {
      statusCode,
      message,
      errors: appendBusinessFailure(
        {},
        getDefaultErrorCode(statusCode),
        translatedMessage,
      ),
    };
  }

  private buildDefaultHttpException(
    statusCode: number,
    lang: string,
  ): NormalizedException {
    const message = getDefaultErrorMessage(statusCode);

    return {
      statusCode,
      message,
      errors: this.buildSingleErrorFromTemplate(
        this.resolveDefaultErrorPath(statusCode),
        getDefaultErrorCode(statusCode),
        message,
        lang,
        this.resolveDefaultErrorKind(statusCode),
      ),
    };
  }

  private buildValidationErrorsOrGeneral(
    errors: readonly ValidationError[],
    lang: string,
    request: RequestWithResponseMeta,
  ): ApiErrors {
    const builtErrors = this.buildValidationErrors(errors, lang, request);

    if (hasApiErrors(builtErrors)) {
      return builtErrors;
    }

    return appendBusinessFailure(
      {},
      getDefaultErrorCode(HttpStatus.BAD_REQUEST),
      this.translateTemplateDescription(COMMON_ERROR_MESSAGES.VALIDATION, lang),
    );
  }

  private buildValidationErrors(
    errors: readonly ValidationError[],
    lang: string,
    request: RequestWithResponseMeta,
  ): ApiErrors {
    const flattenedErrors = flattenValidationErrors(errors);

    return flattenedErrors.reduce<ApiErrors>((bag, item) => {
      const constraints = item.error.constraints ?? {};
      const fieldPath = item.path || item.error.property || GENERAL_ERROR_PATH;

      return Object.entries(constraints).reduce<ApiErrors>(
        (innerBag, [constraintCode, rawMessage]) => {
          const fallbackCode = normalizeConstraintCode(constraintCode);
          const code = getI18nFailureCode(rawMessage, fallbackCode);

          const message = this.translateValidationFailureMessage({
            code,
            rawMessage,
            lang,
          });

          return appendFieldFailure(innerBag, fieldPath, code, message);
        },
        bag,
      );
    }, {});
  }

  private translateValidationFailureMessage(options: {
    code: string;
    rawMessage: string;
    lang: string;
  }): string {
    if (options.code === 'unknown_field') {
      const translatedUnknownField = this.translateIfExists(
        'validation.unknown_field',
        options.lang,
        { property: '' },
      );

      if (translatedUnknownField) {
        return translatedUnknownField;
      }
    }

    return this.translateMaybeI18nMessage(options.rawMessage, options.lang);
  }

  private buildStringMessageErrors(
    messages: readonly string[],
    lang: string,
    hasValidationMessages: boolean,
  ): ApiErrors {
    return messages.reduce<ApiErrors>((bag, rawMessage, index) => {
      const fallbackCode = `message_${index + 1}`;
      const code = getI18nFailureCode(rawMessage, fallbackCode);
      const parsedProperty = getParsedI18nProperty(rawMessage);
      const message = this.translateMaybeI18nMessage(rawMessage, lang);

      if (hasValidationMessages && parsedProperty) {
        return appendFieldFailure(bag, parsedProperty, code, message);
      }

      return appendBusinessFailure(bag, code, message);
    }, {});
  }

  private buildHttpGeneralErrors(
    statusCode: number,
    rawMessage: string,
    lang: string,
  ): ApiErrors {
    const defaultMessage = getDefaultErrorMessage(statusCode);
    const isGenericMessage = this.isGenericHttpMessage(statusCode, rawMessage);
    const isValidationMessage = isValidationI18nMessage(rawMessage);
    const parsedProperty = getParsedI18nProperty(rawMessage);

    const message = isGenericMessage
      ? this.translateTemplateDescription(defaultMessage, lang)
      : this.translateMaybeI18nMessage(rawMessage, lang);

    const code = isValidationMessage
      ? getI18nFailureCode(rawMessage, getDefaultErrorCode(statusCode))
      : getDefaultErrorCode(statusCode);

    if (isValidationMessage && parsedProperty) {
      return appendFieldFailure({}, parsedProperty, code, message);
    }

    const kind = this.resolveDefaultErrorKind(statusCode);

    if (kind === 'system') {
      return appendSystemFailure({}, code, message);
    }

    return appendBusinessFailure({}, code, message);
  }

  private normalizeApiErrors(
    value: unknown,
    lang: string,
    request?: RequestWithResponseMeta,
  ): ApiErrors | undefined {
    if (!isApiErrors(value)) {
      return undefined;
    }

    const normalized = Object.entries(value).reduce<ApiErrors>(
      (bag, [path, entry]) => {
        return entry.failures.reduce<ApiErrors>((innerBag, failure) => {
          return appendFailure(
            innerBag,
            path,
            failure.code,
            this.translateMaybeI18nMessage(failure.message, lang),
            entry.kind,
          );
        }, bag);
      },
      {},
    );

    return hasApiErrors(normalized) ? normalized : undefined;
  }

  private buildSingleErrorFromTemplate(
    path: string,
    code: string,
    template: MessageTemplate,
    lang: string,
    kind: ApiErrorKind,
  ): ApiErrors {
    const message = this.translateTemplateDescription(template, lang);

    if (kind === 'system') {
      return appendSystemFailure({}, code, message);
    }

    if (kind === 'field') {
      return appendFieldFailure({}, path, code, message);
    }

    return appendBusinessFailure({}, code, message);
  }

  private translateMaybeI18nMessage(rawMessage: string, lang: string): string {
    const parsed = parseI18nMessage(rawMessage);

    if (!parsed) {
      return this.normalizeMessageText(rawMessage);
    }

    const translated = String(
      this.i18n.t(parsed.key, {
        lang,
        args: {
          ...parsed.args,
          property: '',
        },
      }),
    );

    return this.normalizeMessageText(translated);
  }

  private translateTemplateDescription(
    template: MessageTemplate,
    lang: string,
  ): string {
    if (template.translate === false) {
      return template.description;
    }

    return String(
      this.i18n.t(template.description, {
        lang,
        args: template.args,
      }),
    );
  }

  private translateIfExists(
    key: string,
    lang: string,
    args?: Record<string, unknown>,
  ): string | undefined {
    const translated = String(
      this.i18n.t(key, {
        lang,
        args,
      }),
    );

    if (translated === key) {
      return undefined;
    }

    return this.normalizeMessageText(translated) || undefined;
  }

  private normalizeMessageText(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
  }

  private resolveDefaultErrorKind(
    statusCode: number,
  ): Exclude<ApiErrorKind, 'field'> {
    return statusCode >= HttpStatus.INTERNAL_SERVER_ERROR
      ? 'system'
      : 'business';
  }

  private resolveDefaultErrorPath(statusCode: number): 'general' | 'system' {
    return statusCode >= HttpStatus.INTERNAL_SERVER_ERROR
      ? SYSTEM_ERROR_PATH
      : GENERAL_ERROR_PATH;
  }

  private isGenericHttpMessage(
    statusCode: number,
    rawMessage: string,
  ): boolean {
    const normalized = rawMessage.trim().toLowerCase();

    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return normalized === 'bad request';
      case HttpStatus.UNAUTHORIZED:
        return normalized === 'unauthorized';
      case HttpStatus.FORBIDDEN:
        return normalized === 'forbidden';
      case HttpStatus.NOT_FOUND:
        return normalized === 'not found';
      case HttpStatus.CONFLICT:
        return normalized === 'conflict';
      case HttpStatus.TOO_MANY_REQUESTS:
        return normalized === 'too many requests';
      case HttpStatus.REQUEST_TIMEOUT:
        return (
          normalized === 'request timeout' || normalized === 'request timed out'
        );
      default:
        return false;
    }
  }

  private isMessageTemplate(value: unknown): value is MessageTemplate {
    return (
      isRecord(value) &&
      typeof value.title === 'string' &&
      typeof value.description === 'string'
    );
  }

  private getExceptionStatusCode(exception: unknown): number | undefined {
    if (typeof exception !== 'object' || exception === null) {
      return undefined;
    }

    const candidate = exception as {
      status?: unknown;
      statusCode?: unknown;
    };

    const rawStatus = candidate.statusCode ?? candidate.status;

    if (typeof rawStatus !== 'number') {
      return undefined;
    }

    if (!Number.isInteger(rawStatus)) {
      return undefined;
    }

    if (rawStatus < 400 || rawStatus > 599) {
      return undefined;
    }

    return rawStatus;
  }

  private getExceptionMessage(exception: unknown): string | undefined {
    if (exception instanceof Error) {
      return exception.message;
    }

    if (typeof exception === 'string') {
      return exception;
    }

    if (isRecord(exception) && typeof exception.message === 'string') {
      return exception.message;
    }

    return undefined;
  }

  private logUnhandledException(
    exception: unknown,
    request: RequestWithResponseMeta,
  ): void {
    const trace = exception instanceof Error ? exception.stack : undefined;
    const message =
      exception instanceof Error ? exception.message : String(exception);

    this.logger.error(
      `Unhandled exception on ${request.method} ${request.originalUrl}: ${message}`,
      trace,
    );
  }
}
