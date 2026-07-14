// src/common/pipes/parse-uuid.pipe.ts
import {
  type ArgumentMetadata,
  BadRequestException,
  Injectable,
  type PipeTransform,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class ParseUUIDPipe implements PipeTransform<unknown, string> {
  constructor(private readonly i18n: I18nService) {}

  transform(value: unknown, metadata: ArgumentMetadata): string {
    if (typeof value === 'string' && isUUID(value)) {
      return value;
    }

    throw new BadRequestException(
      String(
        this.i18n.t('pipes.invalid_uuid', {
          args: { property: metadata.data ?? 'value' },
        }),
      ),
    );
  }
}
