// test/factories/core/repository.factory.ts
import { faker } from '@faker-js/faker';
import type { DeepPartial, ObjectLiteral, Repository } from 'typeorm';

export abstract class RepositoryFactory<
  TEntity extends ObjectLiteral,
  TInput extends object = DeepPartial<TEntity>,
> {
  protected constructor(protected readonly repository: Repository<TEntity>) {}

  protected abstract build(
    overrides: Partial<TInput>,
  ): Promise<DeepPartial<TEntity>> | DeepPartial<TEntity>;

  async make(overrides: Partial<TInput> = {}): Promise<TEntity> {
    const attributes = await this.build(overrides);
    const entity = this.repository.create(attributes);
    return this.repository.save(entity);
  }

  async makeMany(
    count: number,
    overrides: Partial<TInput> | ((index: number) => Partial<TInput>) = {},
  ): Promise<TEntity[]> {
    const items: TEntity[] = [];

    for (let index = 0; index < count; index += 1) {
      const partialOverrides =
        typeof overrides === 'function' ? overrides(index) : overrides;

      items.push(await this.make(partialOverrides));
    }

    return items;
  }
}

export function truncate(value: string, maxLength: number): string {
  return value.length <= maxLength ? value : value.slice(0, maxLength);
}

export function randomEmail(prefix = 'user'): string {
  const local = `${prefix}_${faker.string.alphanumeric(10).toLowerCase()}`;
  return `${local}@example.com`;
}

export function randomUsername(prefix = 'user', maxLength = 32): string {
  const base = `${prefix}_${faker.string
    .alphanumeric(10)
    .toLowerCase()}`.replace(/[^a-z0-9_]/g, '');

  return truncate(base, maxLength);
}

export function randomBool(probabilityTrue = 0.5): boolean {
  return (
    faker.number.float({ min: 0, max: 1, fractionDigits: 4 }) < probabilityTrue
  );
}

export function randomImageFields(
  folder: string,
  basename: string,
  extension: 'png' | 'jpg' | 'jpeg' | 'webp' = 'png',
) {
  const normalizedExtension = extension.toLowerCase();
  const mimeType =
    normalizedExtension === 'jpg' || normalizedExtension === 'jpeg'
      ? 'image/jpeg'
      : normalizedExtension === 'webp'
        ? 'image/webp'
        : 'image/png';

  const fileToken = faker.string.alphanumeric(24).toLowerCase();
  const path = `${folder}/${fileToken}.${normalizedExtension}`;

  return {
    path,
    publicPath: `/${path}`,
    publicUrl: null,
    originalName: truncate(
      `${basename}-${fileToken}.${normalizedExtension}`,
      256,
    ),
    mimeType,
    sizeBytes: String(faker.number.int({ min: 1024, max: 8_000_000 })),
    extension: normalizedExtension,
    width: faker.number.int({ min: 128, max: 2048 }),
    height: faker.number.int({ min: 128, max: 2048 }),
    checksumSha256: faker.string.hexadecimal({
      length: 64,
      casing: 'lower',
      prefix: '',
    }),
  };
}
