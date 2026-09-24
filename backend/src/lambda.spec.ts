import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { NestFactory } from '@nestjs/core';
import { mockClient } from 'aws-sdk-client-mock';
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
  Context,
} from 'aws-lambda';
import { PRODUCTS } from '../test/fixtures';
import { handler } from './lambda';

const dynamo = mockClient(DynamoDBDocumentClient);

const httpApiEvent = (path: string): APIGatewayProxyEventV2 => ({
  version: '2.0',
  routeKey: '$default',
  rawPath: path,
  rawQueryString: '',
  headers: { host: 'api.example', 'user-agent': 'jest' },
  isBase64Encoded: false,
  requestContext: {
    accountId: '123456789012',
    apiId: 'api',
    domainName: 'api.example',
    domainPrefix: 'api',
    requestId: 'request-id',
    routeKey: '$default',
    stage: '$default',
    time: '23/Sep/2026:00:00:00 +0000',
    timeEpoch: 0,
    http: { method: 'GET', path, protocol: 'HTTP/1.1', sourceIp: '127.0.0.1', userAgent: 'jest' },
  },
});

const invoke = async (path: string) =>
  (await handler(httpApiEvent(path), {} as Context, () => undefined)) as APIGatewayProxyStructuredResultV2;

describe('Lambda handler', () => {
  const create = jest.spyOn(NestFactory, 'create');

  beforeEach(() => dynamo.reset());

  it('serves GET /products from an API Gateway HTTP API event', async () => {
    dynamo.on(ScanCommand).resolves({ Items: PRODUCTS });

    const response = await invoke('/products');

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body ?? '')).toHaveLength(PRODUCTS.length);
  });

  it('boots Nest once and reuses it on warm invocations', async () => {
    dynamo.on(ScanCommand).resolves({ Items: [] });

    await invoke('/products');
    await invoke('/products');

    expect(create).toHaveBeenCalledTimes(1);
  });
});
