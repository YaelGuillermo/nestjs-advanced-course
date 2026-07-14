// src/common/limits/utils/typeorm-limit.util.ts
import { BadRequestException } from '@nestjs/common';
import type { ObjectLiteral, Repository } from 'typeorm';
import type { ColumnMetadata } from 'typeorm/metadata/ColumnMetadata';
import { LIMIT_DEFAULTS, LIMIT_ERRORS } from '../constants/limit.constants';
import type { LimitConfig } from '../types/limit.types';

export function findColumnOrThrow<TEntity extends ObjectLiteral>(
  repository: Repository<TEntity>,
  propertyName: string,
): ColumnMetadata {
  const column =
    repository.metadata.findColumnWithPropertyName(propertyName) ??
    repository.metadata.findColumnWithPropertyPath(propertyName) ??
    repository.metadata.columns.find(
      (candidate) => candidate.databaseName === propertyName,
    );

  if (!column) {
    throw new BadRequestException({
      ...LIMIT_ERRORS.PARENT_CONTEXT_NOT_RESOLVED,
      args: {
        field: propertyName,
        entity: repository.metadata.name,
      },
    });
  }

  return column;
}

export function columnPath<TEntity extends ObjectLiteral>(
  repository: Repository<TEntity>,
  alias: string,
  propertyName: string,
): string {
  const column = findColumnOrThrow(repository, propertyName);
  return `${alias}.${column.propertyPath}`;
}

export function deletedAtColumnPath<TEntity extends ObjectLiteral>(
  repository: Repository<TEntity>,
  config: Pick<LimitConfig, 'deletedAtField'>,
  alias = LIMIT_DEFAULTS.ENTITY_ALIAS,
): string {
  const deletedAtColumn = repository.metadata.deleteDateColumn;

  if (deletedAtColumn) {
    return `${alias}.${deletedAtColumn.propertyPath}`;
  }

  return columnPath(
    repository,
    alias,
    config.deletedAtField ?? LIMIT_DEFAULTS.DELETED_AT_FIELD,
  );
}

export function buildRawAlias(propertyName: string): string {
  return `limit_${propertyName
    .replace(/[^A-Za-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase()}`;
}

export function readRawValue(
  raw: Record<string, unknown>,
  keys: readonly string[],
): unknown {
  const normalizedRaw: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(raw)) {
    normalizedRaw[key] = value;
    normalizedRaw[key.toLowerCase()] = value;
  }

  for (const key of keys) {
    const value = normalizedRaw[key] ?? normalizedRaw[key.toLowerCase()];

    if (value !== undefined && value !== null) {
      return value;
    }
  }

  return undefined;
}

export function rawFallbackKeys(
  alias: string,
  field: string,
  column: ColumnMetadata,
): string[] {
  const rawAlias = buildRawAlias(field);

  return [
    rawAlias,
    field,
    column.propertyName,
    column.propertyPath,
    column.databaseName,
    `${alias}_${field}`,
    `${alias}_${column.propertyName}`,
    `${alias}_${column.propertyPath}`,
    `${alias}_${column.databaseName}`,
  ];
}
