// src/common/serialization/serialize.ts
import { plainToInstance, type ClassConstructor } from 'class-transformer';
import { SERIALIZATION_CONTEXT_SYMBOL } from './serialization.constants';

export type SerializationGroup = string;

export interface SerializeOptions<TContext = unknown> {
  groups?: readonly SerializationGroup[];
  context?: TContext;
}

type SerializableObject<TContext = unknown> = object & {
  [SERIALIZATION_CONTEXT_SYMBOL]?: TContext;
};

function isObjectLike(value: unknown): value is object {
  return typeof value === 'object' && value !== null;
}

function attachSerializationContext<TContext>(
  value: unknown,
  context: TContext | undefined,
): void {
  if (!isObjectLike(value) || context === undefined) {
    return;
  }

  Object.defineProperty(value, SERIALIZATION_CONTEXT_SYMBOL, {
    value: context,
    enumerable: false,
    configurable: true,
    writable: false,
  });
}

export function serialize<TDto extends object, TContext = unknown>(
  dto: ClassConstructor<TDto>,
  data: unknown,
  options: SerializeOptions<TContext> = {},
): TDto {
  attachSerializationContext(data, options.context);

  return plainToInstance(dto, data, {
    excludeExtraneousValues: true,
    enableImplicitConversion: true,
    groups: options.groups ? [...options.groups] : undefined,
  });
}

export function serializeArray<TDto extends object, TContext = unknown>(
  dto: ClassConstructor<TDto>,
  items: readonly unknown[],
  options: SerializeOptions<TContext> = {},
): TDto[] {
  return items.map((item) => serialize(dto, item, options));
}

export function getSerializationContext<TContext = unknown>(
  value: unknown,
): TContext | undefined {
  if (!isObjectLike(value)) {
    return undefined;
  }

  const objectWithContext = value as SerializableObject<TContext>;

  return objectWithContext[SERIALIZATION_CONTEXT_SYMBOL];
}
