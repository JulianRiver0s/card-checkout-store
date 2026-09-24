import { ConditionalCheckFailedException, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { SEED_PRODUCTS, seedProducts } from './seed';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const dynamo = mockClient(DynamoDBDocumentClient);
const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }));

beforeEach(() => dynamo.reset());

describe('SEED_PRODUCTS', () => {
  it('has at least 3 products in stock and unique UUID v4 ids', () => {
    expect(SEED_PRODUCTS.filter((product) => product.stock > 0).length).toBeGreaterThanOrEqual(3);
    expect(new Set(SEED_PRODUCTS.map((product) => product.id)).size).toBe(SEED_PRODUCTS.length);
    SEED_PRODUCTS.forEach((product) => {
      expect(product.id).toMatch(UUID_V4);
      expect(Number.isSafeInteger(product.priceInCents)).toBe(true);
    });
  });
});

describe('seedProducts', () => {
  it('inserts every product only if it does not exist yet', async () => {
    dynamo.on(PutCommand).resolves({});

    await expect(seedProducts(db, 'products')).resolves.toEqual({
      inserted: SEED_PRODUCTS.length,
      skipped: 0,
    });

    const puts = dynamo.commandCalls(PutCommand).map((call) => call.args[0].input);
    expect(puts).toEqual(
      SEED_PRODUCTS.map((product) => ({
        TableName: 'products',
        Item: product,
        ConditionExpression: 'attribute_not_exists(id)',
      })),
    );
  });

  it('is idempotent: a second run skips existing products and keeps their stock', async () => {
    dynamo
      .on(PutCommand)
      .rejects(new ConditionalCheckFailedException({ message: 'exists', $metadata: {} }));

    await expect(seedProducts(db, 'products')).resolves.toEqual({
      inserted: 0,
      skipped: SEED_PRODUCTS.length,
    });
  });

  it('propagates any other storage failure', async () => {
    dynamo.on(PutCommand).rejects(new Error('ResourceNotFoundException'));

    await expect(seedProducts(db, 'products')).rejects.toThrow('ResourceNotFoundException');
  });
});
