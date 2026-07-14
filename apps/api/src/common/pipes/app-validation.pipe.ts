// src/common/pipes/app-validation.pipe.ts
import {
  BadRequestException,
  Injectable,
  ValidationPipe,
} from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { ConfigService } from 'src/config/config.service';
import { COMMON_ERROR_MESSAGES } from '../constants/common-message.constants';

@Injectable()
export class AppValidationPipe extends ValidationPipe {
  constructor(configService: ConfigService) {
    super({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: false,
      stopAtFirstError: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
      validationError: {
        target: false,
        value: configService.development.validationErrorsVisible,
      },
      exceptionFactory: (errors: ValidationError[]) => {
        return new BadRequestException({
          message: COMMON_ERROR_MESSAGES.VALIDATION,
          errors,
        });
      },
    });
  }
}
