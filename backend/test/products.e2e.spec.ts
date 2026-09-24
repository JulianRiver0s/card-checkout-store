import { INestApplication, Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { configureApp } from '../src/app.factory';
import { AppModule } from '../src/app.module';
import { PRODUCT_REPOSITORY, ProductRepository } from '../src/application/ports/product.repository';
import { unexpected } from '../src/domain/errors';
import { APP_CONFIG, AppConfig, loadConfig } from '../src/infrastructure/config';
import { InMemoryProductRepository } from './fakes/in-memory-product.repository';
import { IN_STOCK, PRODUCTS, SOLD_OUT } from './fixtures';

const FRONTEND = 'https://shop.example';
const config: AppConfig = { ...loadConfig({}), corsOrigins: [FRONTEND] };

async function startApp(repository: ProductRepository): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(APP_CONFIG)
    .useValue(config)
    .overrideProvider(PRODUCT_REPOSITORY)
    .useValue(repository)
    .compile();
  const app = configureApp(moduleRef.createNestApplication({ logger: false }), config);
  return app.init();
}

describe('Products API (e2e)', () => {
  let app: INestApplication;

  afterEach(async () => {
    await app?.close();
    jest.restoreAllMocks();
  });

  describe('GET /products', () => {
    it('returns the catalog with available units and no raw stock field', async () => {
      app = await startApp(new InMemoryProductRepository(PRODUCTS));

      const res = await request(app.getHttpServer()).get('/products').expect(200);

      expect(res.body).toEqual([
        {
          id: IN_STOCK.id,
          name: IN_STOCK.name,
          description: IN_STOCK.description,
          imageUrl: IN_STOCK.imageUrl,
          priceInCents: IN_STOCK.priceInCents,
          availableUnits: 12,
        },
        expect.objectContaining({ id: SOLD_OUT.id, availableUnits: 0 }),
      ]);
      expect(res.body[0]).not.toHaveProperty('stock');
    });

    it('returns an empty array for an empty catalog', async () => {
      app = await startApp(new InMemoryProductRepository());

      await request(app.getHttpServer()).get('/products').expect(200, []);
    });

    it('answers a generic 500 without infrastructure details when storage fails', async () => {
      jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
      app = await startApp(
        new InMemoryProductRepository([], unexpected(new Error('table products missing'))),
      );

      const res = await request(app.getHttpServer()).get('/products').expect(500);

      expect(JSON.stringify(res.body)).not.toContain('table products');
    });

    it('sends security headers', async () => {
      app = await startApp(new InMemoryProductRepository());

      const res = await request(app.getHttpServer()).get('/products');

      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['content-security-policy']).toBeDefined();
      expect(res.headers['x-powered-by']).toBeUndefined();
    });

    it('allows CORS only for the configured frontend origin', async () => {
      app = await startApp(new InMemoryProductRepository());
      const server = app.getHttpServer();

      const allowed = await request(server).get('/products').set('Origin', FRONTEND);
      const denied = await request(server).get('/products').set('Origin', 'https://evil.example');

      expect(allowed.headers['access-control-allow-origin']).toBe(FRONTEND);
      expect(denied.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  describe('GET /products/:id', () => {
    it('returns the product with the fixed purchase fees', async () => {
      app = await startApp(new InMemoryProductRepository(PRODUCTS));

      const res = await request(app.getHttpServer()).get(`/products/${IN_STOCK.id}`).expect(200);

      expect(res.body).toMatchObject({
        id: IN_STOCK.id,
        availableUnits: 12,
        fees: { baseFeeInCents: 300000, deliveryFeeInCents: 1000000 },
      });
    });

    it('answers 404 for a well-formed id that does not exist', async () => {
      app = await startApp(new InMemoryProductRepository(PRODUCTS));

      await request(app.getHttpServer())
        .get('/products/00000000-0000-4000-8000-000000000000')
        .expect(404);
    });

    it.each(['abc', '3f6c2a1e-8b4d-1f7a-9c2e-1a5b7d9e0f11'])(
      'answers 400 for a malformed id (%s) without querying storage',
      async (id) => {
        const repository = new InMemoryProductRepository(PRODUCTS);
        const findById = jest.spyOn(repository, 'findById');
        app = await startApp(repository);

        await request(app.getHttpServer()).get(`/products/${id}`).expect(400);
        expect(findById).not.toHaveBeenCalled();
      },
    );
  });

  describe('GET /docs', () => {
    it('serves the public API documentation', async () => {
      app = await startApp(new InMemoryProductRepository());

      await request(app.getHttpServer()).get('/docs').expect(200).expect('Content-Type', /html/);
    });
  });
});
