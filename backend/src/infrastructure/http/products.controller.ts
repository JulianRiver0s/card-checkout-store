import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ListProducts } from '../../application/use-cases/list-products';
import { ProductDto } from './product.dto';
import { toHttp } from './to-http';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly listProducts: ListProducts) {}

  /** Lists the whole catalog, sold-out products included. */
  @Get()
  list(): Promise<ProductDto[]> {
    return toHttp(this.listProducts.execute());
  }
}
