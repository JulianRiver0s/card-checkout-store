import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
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
  @ApiOkResponse({ type: ProductDto, isArray: true })
  list(): Promise<ProductDto[]> {
    return toHttp(this.listProducts.execute());
  }

  /** Product detail plus the fixed fees added to every purchase. */
  @Get(':id')
  @ApiOkResponse({ type: ProductDetailDto })
  @ApiBadRequestResponse({ description: 'The id is not a UUID v4' })
  @ApiNotFoundResponse({ description: 'No product with that id' })
  getById(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string): Promise<ProductDetailDto> {
    return toHttp(this.getProduct.execute(id));
  }
}
