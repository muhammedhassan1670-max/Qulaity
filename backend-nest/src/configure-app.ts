import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { json, urlencoded, type NextFunction, type Request, type Response } from 'express';
import { PrismaService } from './prisma/prisma.service';
import { requestIdMiddleware } from './observability/request-id.middleware';
import { LoggingInterceptor } from './observability/logging.interceptor';
import { AllExceptionsFilter } from './observability/all-exceptions.filter';

const parseAllowedOrigins = () =>
  (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const isLocalDevelopmentOrigin = (origin: string) =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);

export function configureQmsApp(app: INestApplication) {
  const httpServer = app.getHttpAdapter().getInstance();
  if (typeof httpServer.disable === 'function') {
    httpServer.disable('x-powered-by');
  }

  app.use(json({ limit: process.env.JSON_BODY_LIMIT ?? '2mb' }));
  app.use(urlencoded({ extended: true, limit: process.env.JSON_BODY_LIMIT ?? '2mb' }));

  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");

    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    next();
  });

  // Support both /api/* and /api/v1/* prefixes.
  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (typeof req.url === 'string' && req.url.startsWith('/api/v1')) {
      req.url = `/api${req.url.slice('/api/v1'.length)}` || '/api';
    }
    next();
  });

  app.use(requestIdMiddleware);
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  const allowedOrigins = parseAllowedOrigins();
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (process.env.NODE_ENV !== 'production' && isLocalDevelopmentOrigin(origin)) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-Request-ID'],
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.get(PrismaService);
}
