import { DynamoDBDocumentClient, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { ResultAsync } from 'neverthrow';
import { ProductRepository } from '../../application/ports/product.repository';
import { AppError, unexpected } from '../../domain/errors';
import { Product } from '../../domain/product';

export class DynamoProductRepository implements ProductRepository {
  constructor(
    private readonly db: DynamoDBDocumentClient,
    private readonly table: string,
  ) {}

  // ponytail: single Scan page (1 MB) is plenty for a <50 item catalog; paginate with LastEvaluatedKey if it grows
  findAll(): ResultAsync<Product[], AppError> {
    return ResultAsync.fromPromise(
      this.db.send(new ScanCommand({ TableName: this.table })),
      unexpected,
    ).map((output) => (output.Items ?? []) as Product[]);
  }

  findById(id: string): ResultAsync<Product | null, AppError> {
    return ResultAsync.fromPromise(
      this.db.send(new GetCommand({ TableName: this.table, Key: { id } })),
      unexpected,
    ).map((output) => (output.Item as Product | undefined) ?? null);
  }
}
