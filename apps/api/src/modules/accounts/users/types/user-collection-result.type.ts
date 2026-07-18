// src/modules/accounts/users/types/user-collection-result.type.ts
import type { NormalizedPagination } from 'src/common/pagination/pagination.types';
import type { UserFilterDto } from '../dto/request/user-filter.dto';
import type { User } from '../entities/user.entity';

export type ResolvedUserFilter = UserFilterDto & NormalizedPagination;

export interface UserCollectionResult {
  items: User[];
  totalItems: number;
  filter: ResolvedUserFilter;
}
