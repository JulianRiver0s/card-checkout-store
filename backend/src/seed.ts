import { ConditionalCheckFailedException, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { Product } from './domain/product';
import { loadConfig } from './infrastructure/config';

// Fixed ids keep the seed idempotent; the sold-out keyboard demos the "agotado" state.
export const SEED_PRODUCTS: Product[] = [
  {
    id: '3f6c2a1e-8b4d-4f7a-9c2e-1a5b7d9e0f11',
    name: 'Audífonos inalámbricos Pulse',
    description:
      'Audífonos over-ear con cancelación activa de ruido, 30 horas de batería y carga rápida USB-C.',
    imageUrl: '/images/products/headphones.webp',
    priceInCents: 18990000,
    stock: 12,
  },
  {
    id: '7a1d4e2b-3c5f-4a8b-8d6e-2b4c6e8f0a22',
    name: 'Reloj inteligente Orbit',
    description:
      'Pantalla AMOLED de 1,4", GPS integrado, monitor de ritmo cardiaco y resistencia al agua 5 ATM.',
    imageUrl: '/images/products/smartwatch.webp',
    priceInCents: 34990000,
    stock: 8,
  },
  {
    id: 'b2e8f4c6-1d3a-4e5b-a7c9-3d5f7a9b1c33',
    name: 'Parlante portátil Boom Mini',
    description: 'Sonido 360°, resistente al agua IPX7 y 12 horas de reproducción continua.',
    imageUrl: '/images/products/speaker.webp',
    priceInCents: 12990000,
    stock: 25,
  },
  {
    id: 'e5c3a7d9-2f4b-4c6d-b8e0-4f6a8c0d2e44',
    name: 'Teclado mecánico Nova 75',
    description: 'Formato 75 %, switches intercambiables en caliente y retroiluminación RGB.',
    imageUrl: '/images/products/keyboard.webp',
    priceInCents: 25990000,
    stock: 0,
  },
];

// Conditional puts: re-running never overwrites a product whose stock already changed.
export async function seedProducts(
  db: DynamoDBDocumentClient,
  table: string,
  products: Product[] = SEED_PRODUCTS,
): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  for (const product of products) {
    try {
      await db.send(
        new PutCommand({
          TableName: table,
          Item: product,
          ConditionExpression: 'attribute_not_exists(id)',
        }),
      );
      inserted++;
    } catch (error) {
      if (!(error instanceof ConditionalCheckFailedException)) throw error;
    }
  }
  return { inserted, skipped: products.length - inserted };
}

/* istanbul ignore next -- CLI entry point: `npm run seed` */
if (require.main === module) {
  const { productsTable } = loadConfig();
  seedProducts(DynamoDBDocumentClient.from(new DynamoDBClient({})), productsTable)
    .then(({ inserted, skipped }) =>
      console.log(`Seeded ${productsTable}: ${inserted} inserted, ${skipped} already present`),
    )
    .catch((error: unknown) => {
      console.error(error);
      process.exit(1);
    });
}
