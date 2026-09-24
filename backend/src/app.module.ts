import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { Module } from '@nestjs/common';
import { PRODUCT_REPOSITORY, ProductRepository } from './application/ports/product.repository';
import { GetProduct } from './application/use-cases/get-product';
import { ListProducts } from './application/use-cases/list-products';
import { APP_CONFIG, AppConfig, loadConfig } from './infrastructure/config';
import { ProductsController } from './infrastructure/http/products.controller';
import { DynamoProductRepository } from './infrastructure/persistence/dynamo-product.repository';

const DYNAMO_CLIENT = Symbol('DynamoClient');

// Composition root: the only place that knows which adapter backs each port.
@Module({
  controllers: [ProductsController],
  providers: [
    { provide: APP_CONFIG, useFactory: () => loadConfig() },
    {
      provide: DYNAMO_CLIENT,
      useFactory: () => DynamoDBDocumentClient.from(new DynamoDBClient({})),
    },
    {
      provide: PRODUCT_REPOSITORY,
      useFactory: (db: DynamoDBDocumentClient, config: AppConfig) =>
        new DynamoProductRepository(db, config.productsTable),
      inject: [DYNAMO_CLIENT, APP_CONFIG],
    },
    {
      provide: ListProducts,
      useFactory: (products: ProductRepository) => new ListProducts(products),
      inject: [PRODUCT_REPOSITORY],
    },
    {
      provide: GetProduct,
      useFactory: (products: ProductRepository, config: AppConfig) =>
        new GetProduct(products, config.fees),
      inject: [PRODUCT_REPOSITORY, APP_CONFIG],
    },
  ],
})
export class AppModule {}
