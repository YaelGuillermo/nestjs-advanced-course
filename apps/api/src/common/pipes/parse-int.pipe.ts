// src/common/pipes/parse-int.pipe.ts
import {
  type ArgumentMetadata,
  BadRequestException,
  Injectable,
  type PipeTransform,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class ParseIntPipe implements PipeTransform<unknown, number> {
  constructor(private readonly i18n: I18nService) {}

  transform(value: unknown, metadata: ArgumentMetadata): number {
    const parsed = typeof value === 'number' ? value : Number(value);

    if (Number.isInteger(parsed)) {
      return parsed;
    }

    throw new BadRequestException(
      String(
        this.i18n.t('pipes.invalid_int', {
          args: { property: metadata.data ?? 'value' },
        }),
      ),
    );
  }
}
