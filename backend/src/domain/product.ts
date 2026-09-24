export interface Product {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly imageUrl: string;
  readonly priceInCents: number;
  readonly stock: number;
}

export type CatalogItem = Omit<Product, 'stock'> & { readonly availableUnits: number };

// A negative stock can only come from bad data; show it as sold out instead of leaking it.
export function toCatalogItem({ stock, ...product }: Product): CatalogItem {
  return { ...product, availableUnits: Math.max(0, stock) };
}
