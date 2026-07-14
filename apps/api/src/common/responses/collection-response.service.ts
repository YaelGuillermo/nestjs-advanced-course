// src/common/responses/collection-response.service.ts
import { Injectable } from '@nestjs/common';
import {
  buildCollectionHateoasFromPagination,
  buildCollectionPagination,
  type CollectionPaginationData,
  type CollectionResponseExtras,
} from './collection-response.util';
import { HateoasService } from './hateoas.service';
import type { LimitsInfo } from './response.types';

@Injectable()
export class CollectionResponseService {
  constructor(private readonly hateoasService: HateoasService) {}

  buildPagination(requestPath: string, pagination: CollectionPaginationData) {
    return buildCollectionPagination(requestPath, pagination);
  }

  buildHateoasFromPagination(
    requestPath: string,
    pagination: CollectionPaginationData,
  ) {
    return buildCollectionHateoasFromPagination(
      requestPath,
      this.hateoasService,
      pagination,
    );
  }

  buildExtras(
    requestPath: string,
    pagination: CollectionPaginationData,
    limits?: LimitsInfo | null,
  ): CollectionResponseExtras {
    const paginationData = this.buildPagination(requestPath, pagination);
    const links = this.buildHateoasFromPagination(requestPath, pagination);

    return limits
      ? { pagination: paginationData, links, limits }
      : { pagination: paginationData, links };
  }
}
