import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppConfig } from './infrastructure/config';

// Shared by main.ts, lambda.ts and the e2e tests so every entry point gets the same hardening.
export function configureApp<T extends INestApplication>(app: T, config: AppConfig): T {
  app.use(helmet());
  app.enableCors({ origin: config.corsOrigins, methods: ['GET', 'POST', 'PATCH'] });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Checkout Store API')
      .setDescription('Products, customers, transactions and deliveries for the card checkout')
      .setVersion('1.0.0')
      .build(),
  );
  SwaggerModule.setup('docs', app, document);

  return app;
}
