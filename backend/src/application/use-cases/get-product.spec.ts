import { InMemoryProductRepository } from '../../../test/fakes/in-memory-product.repository';
import { IN_STOCK, PRODUCTS } from '../../../test/fixtures';
import { unexpected } from '../../domain/errors';
import { toCatalogItem } from '../../domain/product';
import { GetProduct } from './get-product';

const fees = { baseFeeInCents: 300000, deliveryFeeInCents: 1000000 };

describe('GetProduct', () => {
  it('returns the product with the fixed purchase fees', async () => {
    const result = await new GetProduct(new InMemoryProductRepository(PRODUCTS), fees).execute(
      IN_STOCK.id,
    );

    expect(result._unsafeUnwrap()).toEqual({ ...toCatalogItem(IN_STOCK), fees });
  });

  it('fails with NOT_FOUND when the product does not exist', async () => {
    const missing = '00000000-0000-4000-8000-000000000000';
    const result = await new GetProduct(new InMemoryProductRepository(PRODUCTS), fees).execute(
      missing,
    );

    expect(result._unsafeUnwrapErr()).toEqual({
      type: 'NOT_FOUND',
      message: `Product ${missing} not found`,
    });
  });

  it('propagates repository failures', async () => {
    const failure = unexpected(new Error('boom'));
    const result = await new GetProduct(new InMemoryProductRepository([], failure), fees).execute(
      IN_STOCK.id,
    );

    expect(result._unsafeUnwrapErr()).toBe(failure);
  });
});
