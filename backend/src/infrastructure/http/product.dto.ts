import { CatalogItem } from '../../domain/product';

// Response shapes for the OpenAPI docs; the Nest Swagger CLI plugin reads these comments.
export class ProductDto implements CatalogItem {
  /** @example 3f6c2a1e-8b4d-4f7a-9c2e-1a5b7d9e0f11 */
  id!: string;
  /** @example Audífonos inalámbricos Pulse */
  name!: string;
  description!: string;
  /** Path served by the frontend CDN. @example /images/products/headphones.webp */
  imageUrl!: string;
  /** Unit price in COP cents. @example 18990000 */
  priceInCents!: number;
  /** Units left in stock; 0 means sold out. @example 12 */
  availableUnits!: number;
}
