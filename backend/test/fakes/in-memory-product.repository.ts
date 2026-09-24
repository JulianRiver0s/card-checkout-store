import { errAsync, okAsync, ResultAsync } from 'neverthrow';
import { ProductRepository } from '../../src/application/ports/product.repository';
import { AppError } from '../../src/domain/errors';
import { Product } from '../../src/domain/product';

export class InMemoryProductRepository implements ProductRepository {
  constructor(
    private readonly products: Product[] = [],
    private readonly failure?: AppError,
  ) {}

  findAll(): ResultAsync<Product[], AppError> {
    return this.failure ? errAsync(this.failure) : okAsync([...this.products]);
  }

  findById(id: string): ResultAsync<Product | null, AppError> {
    if (this.failure) return errAsync(this.failure);
    return okAsync(this.products.find((product) => product.id === id) ?? null);
  }
}
