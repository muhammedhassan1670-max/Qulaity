import express from 'express';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import type { IncomingMessage, ServerResponse } from 'http';
import { AppModule } from '../src/app.module';
import { configureQmsApp } from '../src/configure-app';

const expressServer = express();
let bootstrapPromise: Promise<void> | undefined;

const hasValue = (value: string | undefined) => Boolean(value && value.trim());

const isLightHealthRequest = (url = '') =>
  url === '/api/health/live' ||
  url === '/api/health/serverless' ||
  url === '/health/live' ||
  url === '/health/serverless';

const writeJson = (res: ServerResponse, statusCode: number, payload: unknown) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
};

async function bootstrapServerlessApp() {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      const app = await NestFactory.create(AppModule, new ExpressAdapter(expressServer), {
        bodyParser: false,
        logger: ['error', 'warn', 'log'],
      });

      configureQmsApp(app);
      await app.init();
    })();
  }

  await bootstrapPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (isLightHealthRequest(req.url)) {
    writeJson(res, 200, {
      ok: true,
      runtime: 'vercel-serverless',
      env: {
        databaseUrl: hasValue(process.env.DATABASE_URL),
        directUrl: hasValue(process.env.DIRECT_URL),
        jwtSecret: hasValue(process.env.JWT_SECRET),
        corsOrigin: hasValue(process.env.CORS_ORIGIN),
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  try {
    await bootstrapServerlessApp();
    expressServer(req, res);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown serverless bootstrap error';
    // eslint-disable-next-line no-console
    console.error('[qms-backend] Serverless bootstrap failed:', error);

    writeJson(res, 500, {
      ok: false,
      error: 'QMS backend failed to start',
      message,
      env: {
        databaseUrl: hasValue(process.env.DATABASE_URL),
        directUrl: hasValue(process.env.DIRECT_URL),
        jwtSecret: hasValue(process.env.JWT_SECRET),
        corsOrigin: hasValue(process.env.CORS_ORIGIN),
      },
      timestamp: new Date().toISOString(),
    });
  }
}
