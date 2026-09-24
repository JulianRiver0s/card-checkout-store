import { ResultAsync } from 'neverthrow';
import { AppError } from '../../domain/errors';
import { Product } from '../../domain/product';

export interface ProductRepository {
  findAll(): ResultAsync<Product[], AppError>;
  findById(id: string): ResultAsync<Product | null, AppError>;
}

export const PRODUCT_REPOSITORY = Symbol('ProductRepository');
