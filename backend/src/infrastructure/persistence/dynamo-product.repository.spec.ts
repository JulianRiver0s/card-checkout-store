import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { PRODUCTS } from '../../../test/fixtures';
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
