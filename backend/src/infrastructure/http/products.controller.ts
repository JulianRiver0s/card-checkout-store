import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetProduct } from '../../application/use-cases/get-product';
import { ListProducts } from '../../application/use-cases/list-products';
import { ProductDetailDto, ProductDto } from './product.dto';
import { toHttp } from './to-http';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly listProducts: ListProducts,
    private readonly getProduct: GetProduct,
  ) {}

  /** Lists the whole catalog, sold-out products included. */
  @Get()
  list(): Promise<ProductDto[]> {
    return toHttp(this.listProducts.execute());
  }

  /** Product detail plus the fixed fees added to every purchase. */
  @Get(':id')
  getById(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string): Promise<ProductDetailDto> {
    return toHttp(this.getProduct.execute(id));
  }
}
