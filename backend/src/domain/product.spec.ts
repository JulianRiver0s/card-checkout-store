import { Product, toCatalogItem } from './product';

const product = (stock: number): Product => ({
  id: '3f6c2a1e-8b4d-4f7a-9c2e-1a5b7d9e0f11',
  name: 'Headphones',
  description: 'Wireless',
  imageUrl: '/images/products/headphones.webp',
  priceInCents: 18990000,
  stock,
});

describe('toCatalogItem', () => {
  it('exposes the stock as availableUnits and hides the raw stock field', () => {
    const item = toCatalogItem(product(12));
    expect(item.availableUnits).toBe(12);
    expect(item).not.toHaveProperty('stock');
    expect(item).toMatchObject({ id: product(12).id, priceInCents: 18990000 });
  });

  it('keeps a sold-out product with 0 units', () => {
    expect(toCatalogItem(product(0)).availableUnits).toBe(0);
  });

  it('presents a corrupted negative stock as sold out', () => {
    expect(toCatalogItem(product(-3)).availableUnits).toBe(0);
  });
});
