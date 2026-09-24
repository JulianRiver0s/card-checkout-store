import { errAsync, okAsync, ResultAsync } from 'neverthrow';
import { AppError, notFound } from '../../domain/errors';
import { PurchaseFees } from '../../domain/fees';
import { CatalogItem, Product, toCatalogItem } from '../../domain/product';
import { ProductRepository } from '../ports/product.repository';

export type ProductDetail = CatalogItem & { fees: PurchaseFees };

export class GetProduct {
  constructor(
    private readonly products: ProductRepository,
    private readonly fees: PurchaseFees,
  ) {}

  execute(id: string): ResultAsync<ProductDetail, AppError> {
    return this.products
      .findById(id)
      .andThen((product) =>
        product
          ? okAsync<Product, AppError>(product)
          : errAsync(notFound(`Product ${id} not found`)),
      )
      .map((product) => ({ ...toCatalogItem(product), fees: this.fees }));
  }
}
