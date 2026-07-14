// src/common/responses/hateoas.service.ts
import { Injectable } from '@nestjs/common';
import { stripQueryString } from '../utils/query-string.util';
import type { ApiLinks } from './response.types';

export interface CollectionLinksOptions {
  path: string;
  create?: boolean;
  first?: string;
  last?: string;
  previous?: string | null;
  next?: string | null;
}

export interface DetailLinksOptions {
  self: string;
  collection?: string;
  update?: boolean;
  remove?: boolean;
}

@Injectable()
export class HateoasService {
  buildCollectionLinks(options: CollectionLinksOptions): ApiLinks {
    return {
      self: { href: options.path, method: 'GET' },
      ...(options.create
        ? {
            create: {
              href: stripQueryString(options.path),
              method: 'POST' as const,
            },
          }
        : {}),
      ...(options.first
        ? { first: { href: options.first, method: 'GET' as const } }
        : {}),
      ...(options.last
        ? { last: { href: options.last, method: 'GET' as const } }
        : {}),
      ...(options.previous
        ? { previous: { href: options.previous, method: 'GET' as const } }
        : {}),
      ...(options.next
        ? { next: { href: options.next, method: 'GET' as const } }
        : {}),
    };
  }

  buildDetailLinks(options: DetailLinksOptions): ApiLinks {
    return {
      self: { href: options.self, method: 'GET' },
      ...(options.collection
        ? { collection: { href: options.collection, method: 'GET' as const } }
        : {}),
      ...(options.update
        ? { update: { href: options.self, method: 'PATCH' as const } }
        : {}),
      ...(options.remove
        ? { delete: { href: options.self, method: 'DELETE' as const } }
        : {}),
    };
  }
}
