import express from 'express';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import type { IncomingMessage, ServerResponse } from 'http';
import { AppModule } from '../src/app.module';
import { configureQmsApp } from '../src/configure-app';

const expressServer = express();
let bootstrapPromise: Promise<void> | undefined;

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
  await bootstrapServerlessApp();
  expressServer(req, res);
}
