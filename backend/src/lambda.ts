import serverlessExpress from '@codegenie/serverless-express';
import { NestFactory } from '@nestjs/core';
import type { Handler } from 'aws-lambda';
import { configureApp } from './app.factory';
import { AppModule } from './app.module';
import { APP_CONFIG, AppConfig } from './infrastructure/config';

let server: Handler | undefined;

async function bootstrap(): Promise<Handler> {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
  configureApp(app, app.get<AppConfig>(APP_CONFIG));
  await app.init();
  return serverlessExpress({ app: app.getHttpAdapter().getInstance() });
}

// Nest boots once per container; warm invocations reuse the cached server.
export const handler: Handler = async (event, context, callback) => {
  server ??= await bootstrap();
  return server(event, context, callback);
};
