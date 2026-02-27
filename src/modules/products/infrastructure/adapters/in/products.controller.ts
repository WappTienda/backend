import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProductsService } from '../../../domain/services/products-domain.service';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
} from '../../../application/dto';
import { ProductModel } from '../../../domain/models/product.model';
import { Public } from '../../../../../common/decorators';
import { PaginatedResponseDto } from '../../../../../common/dto';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all visible products (public)' })
  @ApiResponse({ status: 200 })
  async findAllPublic(
    @Query() query: ProductQueryDto,
  ): Promise<PaginatedResponseDto<ProductModel>> {
    return this.productsService.findAllPublic(query);
  }

  @Get('admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all products including hidden/deleted (admin)',
  })
  @ApiResponse({ status: 200 })
  async findAllAdmin(
    @Query() query: ProductQueryDto,
  ): Promise<PaginatedResponseDto<ProductModel>> {
    return this.productsService.findAllAdmin(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID (public)' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOnePublic(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProductModel> {
    return this.productsService.findByIdPublic(id);
  }

  @Get('admin/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get product by ID including deleted (admin)' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOneAdmin(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProductModel> {
    return this.productsService.findById(id, true);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product (admin)' })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 409, description: 'Product with SKU already exists' })
  async create(@Body() dto: CreateProductDto): Promise<ProductModel> {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product (admin)' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductModel> {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a product (admin)' })
  @ApiResponse({ status: 204, description: 'Product deleted' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.productsService.delete(id);
  }

  @Post(':id/restore')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restore a soft-deleted product (admin)' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async restore(@Param('id', ParseUUIDPipe) id: string): Promise<ProductModel> {
    return this.productsService.restore(id);
  }
}
