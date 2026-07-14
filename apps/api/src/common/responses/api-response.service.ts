// src/common/responses/api-response.service.ts
import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { ConfigService } from 'src/config/config.service';
import {
  DEFAULT_ERROR_MESSAGE_DURATION_MS,
  DEFAULT_SUCCESS_MESSAGE_DURATION_MS,
} from '../constants/common-message.constants';
import type { ResponseEnvelopeOptions } from '../decorators/response-envelope-options.decorator';
import { buildPageUrl } from '../utils/query-string.util';
import { mergeSuccessResponseExtras } from './response-extras.util';
import type {
  ApiErrorResponse,
  ApiErrors,
  ApiLinks,
  ApiSuccessResponse,
  MessageTemplate,
  PaginationLinks,
  PaginationMeta,
  RequestWithResponseMeta,
  ResponseMessage,
  ResponseMeta,
} from './response.types';
import {
  getRequestPath,
  normalizeSuccessPayload,
  resolveRequestLocale,
} from './response.util';

@Injectable()
export class ApiResponseService {
  constructor(
    private readonly i18n: I18nService,
    private readonly configService: ConfigService,
  ) {}

  createSuccess(
    request: RequestWithResponseMeta,
    statusCode: number,
    payload: unknown,
    template?: MessageTemplate,
    options?: ResponseEnvelopeOptions,
  ): ApiSuccessResponse<unknown> {
    const normalized = normalizeSuccessPayload(payload);
    const locale = resolveRequestLocale(request);
    const currentPath = getRequestPath(request);
    const requestLimits =
      options?.includeRequestLimits === false ? undefined : request.__limits;

    const mergedExtras = mergeSuccessResponseExtras(request.__responseExtras, {
      pagination: normalized.pagination,
      limits: normalized.limits ?? requestLimits,
      links: normalized.links,
    });

    const pagination = mergedExtras.pagination
      ? this.ensurePaginationLinks(
          mergedExtras.pagination.meta,
          mergedExtras.pagination.links,
          request,
        )
      : undefined;

    const links = this.mergeLinks(
      this.buildTopLevelLinks(currentPath, pagination),
      mergedExtras.links,
    );

    return {
      status: true,
      statusCode,
      path: currentPath,
      ...(template
        ? {
            message: this.translateMessage(
              template,
              locale,
              DEFAULT_SUCCESS_MESSAGE_DURATION_MS,
            ),
          }
        : {}),
      data: normalized.data,
      ...(pagination ? { pagination } : {}),
      ...(Object.keys(links).length > 0 ? { links } : {}),
      ...(mergedExtras.limits ? { limits: mergedExtras.limits } : {}),
      meta: this.buildMeta(request),
      timestamp: new Date().toISOString(),
    };
  }

  createError(
    request: RequestWithResponseMeta,
    statusCode: number,
    template: MessageTemplate,
    errors?: ApiErrors,
  ): ApiErrorResponse {
    const locale = resolveRequestLocale(request);
    const currentPath = getRequestPath(request);

    return {
      status: false,
      statusCode,
      path: currentPath,
      message: this.translateMessage(
        template,
        locale,
        DEFAULT_ERROR_MESSAGE_DURATION_MS,
      ),
      data: null,
      ...(errors ? { errors } : {}),
      meta: this.buildMeta(request),
      timestamp: new Date().toISOString(),
    };
  }

  translateMessage(
    template: MessageTemplate,
    lang: string,
    defaultDurationMs = DEFAULT_SUCCESS_MESSAGE_DURATION_MS,
  ): ResponseMessage {
    const durationMs = template.durationMs ?? defaultDurationMs;

    if (template.translate === false) {
      return {
        title: template.title,
        description: template.description,
        durationMs,
      };
    }

    return {
      title: String(
        this.i18n.t(template.title, {
          lang,
          args: template.args,
        }),
      ),
      description: String(
        this.i18n.t(template.description, {
          lang,
          args: template.args,
        }),
      ),
      durationMs,
    };
  }

  private buildMeta(request: RequestWithResponseMeta): ResponseMeta {
    return {
      apiVersion: this.configService.api.version,
      environment: this.configService.app.nodeEnv,
      requestId: request.id ?? '',
      locale: resolveRequestLocale(request),
    };
  }

  private ensurePaginationLinks(
    meta: PaginationMeta,
    links: PaginationLinks | undefined,
    request: RequestWithResponseMeta,
  ): { meta: PaginationMeta; links: PaginationLinks } {
    return {
      meta,
      links: links ?? {
        previous:
          meta.currentPage > 1
            ? buildPageUrl(
                getRequestPath(request),
                meta.currentPage - 1,
                meta.pageSize,
              )
            : null,
        next:
          meta.currentPage < meta.totalPages
            ? buildPageUrl(
                getRequestPath(request),
                meta.currentPage + 1,
                meta.pageSize,
              )
            : null,
        first: buildPageUrl(getRequestPath(request), 1, meta.pageSize),
        last: buildPageUrl(
          getRequestPath(request),
          meta.totalPages,
          meta.pageSize,
        ),
      },
    };
  }

  private buildTopLevelLinks(
    currentPath: string,
    pagination?: { meta: PaginationMeta; links: PaginationLinks },
  ): ApiLinks {
    return {
      self: { href: currentPath, method: 'GET' },
      ...(pagination
        ? {
            first: { href: pagination.links.first, method: 'GET' as const },
            last: { href: pagination.links.last, method: 'GET' as const },
          }
        : {}),
      ...(pagination?.links.previous
        ? {
            previous: {
              href: pagination.links.previous,
              method: 'GET' as const,
            },
          }
        : {}),
      ...(pagination?.links.next
        ? { next: { href: pagination.links.next, method: 'GET' as const } }
        : {}),
    };
  }

  private mergeLinks(defaultLinks: ApiLinks, customLinks?: ApiLinks): ApiLinks {
    return {
      ...defaultLinks,
      ...(customLinks ?? {}),
    };
  }
}
