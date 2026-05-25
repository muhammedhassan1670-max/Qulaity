import { NestFactory } from '@nestjs/core';
import { WsAdapter } from '@nestjs/platform-ws';
import { AppModule } from './app.module';
import { configureQmsApp } from './configure-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.useWebSocketAdapter(new WsAdapter(app));
  app.enableShutdownHooks();
  configureQmsApp(app);

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
}
bootstrap();
