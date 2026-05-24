import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request & { user?: any; requestId?: string }>();
    const res = http.getResponse<{ statusCode?: number }>();

    const start = process.hrtime.bigint();

    return next.handle().pipe(
      tap(() => {
        const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
        const headers = (req as any)?.headers ?? {};
        const log = {
          level: 'info',
          msg: 'http_request',
          requestId: req?.requestId,
          method: (req as any)?.method,
          path: (req as any)?.originalUrl ?? (req as any)?.url,
          statusCode: (res as any)?.statusCode,
          durationMs: Math.round(durationMs),
          ip: (req as any)?.ip,
          userAgent: headers['user-agent'],
          userId: req?.user?.sub ?? req?.user?.id,
        };

        this.logger.log(JSON.stringify(log));
      }),
      catchError((err) => {
        const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
        const headers = (req as any)?.headers ?? {};
        const log = {
          level: 'error',
          msg: 'http_request_error',
          requestId: req?.requestId,
          method: (req as any)?.method,
          path: (req as any)?.originalUrl ?? (req as any)?.url,
          durationMs: Math.round(durationMs),
          ip: (req as any)?.ip,
          userAgent: headers['user-agent'],
          userId: req?.user?.sub ?? req?.user?.id,
          errorName: err?.name,
          errorMessage: err?.message,
        };

        this.logger.error(JSON.stringify(log));
        return throwError(() => err);
      }),
    );
  }
}
