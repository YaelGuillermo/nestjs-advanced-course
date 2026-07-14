// src/common/pipes/parse-enum.pipe.ts
import {
  type ArgumentMetadata,
  BadRequestException,
  Injectable,
  type PipeTransform,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

type EnumPrimitive = string | number;
type EnumObject = Record<string, EnumPrimitive>;

@Injectable()
export class ParseEnumPipe<TEnum extends EnumObject>
  implements PipeTransform<unknown, TEnum[keyof TEnum]>
{
  private readonly allowedValues: ReadonlySet<EnumPrimitive>;

  constructor(
    enumObject: TEnum,
    private readonly i18n: I18nService,
  ) {
    this.allowedValues = new Set(Object.values(enumObject));
  }

  transform(value: unknown, metadata: ArgumentMetadata): TEnum[keyof TEnum] {
    const normalizedValue = this.normalizeValue(value);

    if (
      normalizedValue !== undefined &&
      this.allowedValues.has(normalizedValue)
    ) {
      return normalizedValue as TEnum[keyof TEnum];
    }

    throw new BadRequestException(
      String(
        this.i18n.t('pipes.invalid_enum', {
          args: { property: metadata.data ?? 'value' },
        }),
      ),
    );
  }

  private normalizeValue(value: unknown): EnumPrimitive | undefined {
    if (typeof value === 'string' || typeof value === 'number') {
      return value;
    }

    return undefined;
  }
}
