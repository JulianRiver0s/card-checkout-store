import { NestFactory } from '@nestjs/core';
import { configureApp } from './app.factory';
import { AppModule } from './app.module';
import { APP_CONFIG, AppConfig } from './infrastructure/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get<AppConfig>(APP_CONFIG);
  await configureApp(app, config).listen(config.port);
}

void bootstrap();
