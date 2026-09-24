import { InMemoryProductRepository } from '../../../test/fakes/in-memory-product.repository';
import { PRODUCTS } from '../../../test/fixtures';
import { unexpected } from '../../domain/errors';
import { toCatalogItem } from '../../domain/product';
import { ListProducts } from './list-products';

describe('ListProducts', () => {
  it('returns every product as a catalog item, sold-out ones included', async () => {
    const result = await new ListProducts(new InMemoryProductRepository(PRODUCTS)).execute();

    expect(result._unsafeUnwrap()).toEqual(PRODUCTS.map(toCatalogItem));
  });

  it('returns an empty list for an empty catalog', async () => {
    const result = await new ListProducts(new InMemoryProductRepository()).execute();

    expect(result._unsafeUnwrap()).toEqual([]);
  });

  it('propagates repository failures', async () => {
    const failure = unexpected(new Error('boom'));
    const result = await new ListProducts(new InMemoryProductRepository([], failure)).execute();

    expect(result._unsafeUnwrapErr()).toBe(failure);
  });
});
