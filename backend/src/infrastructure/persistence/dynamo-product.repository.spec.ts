import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { IN_STOCK, PRODUCTS } from '../../../test/fixtures';
import { DynamoProductRepository } from './dynamo-product.repository';

const dynamo = mockClient(DynamoDBDocumentClient);
const repository = new DynamoProductRepository(
  DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' })),
  'products',
);

beforeEach(() => dynamo.reset());

describe('DynamoProductRepository.findAll', () => {
  it('scans the configured table', async () => {
    dynamo.on(ScanCommand, { TableName: 'products' }).resolves({ Items: PRODUCTS });

    expect((await repository.findAll())._unsafeUnwrap()).toEqual(PRODUCTS);
  });

  it('returns an empty list when the table has no items', async () => {
    dynamo.on(ScanCommand).resolves({});

    expect((await repository.findAll())._unsafeUnwrap()).toEqual([]);
  });

  it('wraps SDK failures as UNEXPECTED errors', async () => {
    dynamo.on(ScanCommand).rejects(new Error('ProvisionedThroughputExceededException'));

    expect((await repository.findAll())._unsafeUnwrapErr().type).toBe('UNEXPECTED');
  });
});

describe('DynamoProductRepository.findById', () => {
  it('gets the item by its id', async () => {
    dynamo
      .on(GetCommand, { TableName: 'products', Key: { id: IN_STOCK.id } })
      .resolves({ Item: IN_STOCK });

    expect((await repository.findById(IN_STOCK.id))._unsafeUnwrap()).toEqual(IN_STOCK);
  });

  it('returns null when the item does not exist', async () => {
    dynamo.on(GetCommand).resolves({});

    expect((await repository.findById(IN_STOCK.id))._unsafeUnwrap()).toBeNull();
  });

  it('wraps SDK failures as UNEXPECTED errors', async () => {
    dynamo.on(GetCommand).rejects(new Error('AccessDeniedException'));

    expect((await repository.findById(IN_STOCK.id))._unsafeUnwrapErr().type).toBe('UNEXPECTED');
  });
});
