// src/common/interceptors/timeout.interceptor.ts
import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
  RequestTimeoutException,
} from '@nestjs/common';
import {
  catchError,
  type Observable,
  throwError,
  timeout,
  TimeoutError,
} from 'rxjs';
import { ConfigService } from 'src/config/config.service';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor<unknown, unknown> {
  constructor(private readonly configService: ConfigService) {}

  intercept(
    _context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<unknown> {
    return next.handle().pipe(
      timeout(this.configService.behavior.requestTimeoutMs),
      catchError((error: unknown) => {
        if (error instanceof TimeoutError) {
          return throwError(() => new RequestTimeoutException());
        }

        return throwError(() => error);
      }),
    );
  }
}
