import serverlessExpress from '@codegenie/serverless-express';
import { NestFactory } from '@nestjs/core';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Context } from 'aws-lambda';
import { configureApp } from './app.factory';
import { AppModule } from './app.module';
import { APP_CONFIG, AppConfig } from './infrastructure/config';

// Node.js 24+ Lambda runtimes only accept (event, context) handlers; no callback parameter.
type HttpApiHandler = (
  event: APIGatewayProxyEventV2,
  context: Context,
) => Promise<APIGatewayProxyResultV2>;

let server: HttpApiHandler | undefined;

async function bootstrap(): Promise<HttpApiHandler> {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
  configureApp(app, app.get<AppConfig>(APP_CONFIG));
  await app.init();
  // serverless-express resolves a promise when called without a callback (default PROMISE mode).
  return serverlessExpress({ app: app.getHttpAdapter().getInstance() }) as unknown as HttpApiHandler;
}

// Nest boots once per container; warm invocations reuse the cached server.
export const handler: HttpApiHandler = async (event, context) => {
  server ??= await bootstrap();
  return server(event, context);
};
