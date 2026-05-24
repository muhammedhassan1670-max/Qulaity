import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<any>();
    const request = ctx.getRequest<any>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = isHttpException ? exception.getResponse() : undefined;

    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any)?.message ?? (exception as any)?.message;

    const payload = {
      statusCode: status,
      message,
      error: isHttpException
        ? (exceptionResponse as any)?.error ?? (exception as any)?.name
        : 'InternalServerError',
      requestId: request?.requestId,
      path: request?.originalUrl ?? request?.url,
      timestamp: new Date().toISOString(),
    };

    const log = {
      level: status >= 500 ? 'error' : 'warn',
      msg: 'http_exception',
      ...payload,
      stack: (exception as any)?.stack,
    };

    if (status >= 500) {
      this.logger.error(JSON.stringify(log));
    } else {
      this.logger.warn(JSON.stringify(log));
    }

    response.status(status).json(payload);
  }
}
