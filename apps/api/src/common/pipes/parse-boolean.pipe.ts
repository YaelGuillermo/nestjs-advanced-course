// src/common/pipes/parse-boolean.pipe.ts
import {
  type ArgumentMetadata,
  BadRequestException,
  Injectable,
  type PipeTransform,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { parseBooleanish } from '../utils/boolean.util';

@Injectable()
export class ParseBooleanPipe implements PipeTransform<unknown, boolean> {
  constructor(private readonly i18n: I18nService) {}

  transform(value: unknown, metadata: ArgumentMetadata): boolean {
    const parsed = parseBooleanish(value);

    if (parsed !== undefined) {
      return parsed;
    }

    throw new BadRequestException(
      String(
        this.i18n.t('pipes.invalid_boolean', {
          args: { property: metadata.data ?? 'value' },
        }),
      ),
    );
  }
}
