import { ResultAsync } from 'neverthrow';
import { AppError } from '../../domain/errors';
import { CatalogItem, toCatalogItem } from '../../domain/product';
import { ProductRepository } from '../ports/product.repository';

export class ListProducts {
  constructor(private readonly products: ProductRepository) {}

  execute(): ResultAsync<CatalogItem[], AppError> {
    return this.products.findAll().map((products) => products.map(toCatalogItem));
  }
}
