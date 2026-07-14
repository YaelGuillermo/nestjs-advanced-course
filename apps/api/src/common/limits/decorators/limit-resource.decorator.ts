// src/common/limits/decorators/limit-resource.decorator.ts
import { Reflector } from '@nestjs/core';
import type { ObjectLiteral } from 'typeorm';

export type LimitableEntity<TEntity extends ObjectLiteral = ObjectLiteral> =
  abstract new (...args: never[]) => TEntity;

export const LimitResource = Reflector.createDecorator<LimitableEntity>();
