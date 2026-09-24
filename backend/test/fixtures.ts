import { Product } from '../src/domain/product';

export const IN_STOCK: Product = {
  id: '3f6c2a1e-8b4d-4f7a-9c2e-1a5b7d9e0f11',
  name: 'Wireless headphones',
  description: 'Over-ear, 30 h battery',
  imageUrl: '/images/products/headphones.webp',
  priceInCents: 18990000,
  stock: 12,
};

export const SOLD_OUT: Product = {
  id: 'e5c3a7d9-2f4b-4c6d-b8e0-4f6a8c0d2e44',
  name: 'Mechanical keyboard',
  description: 'Hot-swappable switches',
  imageUrl: '/images/products/keyboard.webp',
  priceInCents: 25990000,
  stock: 0,
};

export const PRODUCTS = [IN_STOCK, SOLD_OUT];
