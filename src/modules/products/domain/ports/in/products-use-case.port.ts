import { ProductModel } from '../../models/product.model';
import { PaginatedResponseDto } from '../../../../../common/dto';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
} from '../../../application/dto';

export const PRODUCTS_USE_CASE = Symbol('PRODUCTS_USE_CASE');

export interface ProductsUseCasePort {
  findAllPublic(
    query: ProductQueryDto,
  ): Promise<PaginatedResponseDto<ProductModel>>;
  findAllAdmin(
    query: ProductQueryDto,
  ): Promise<PaginatedResponseDto<ProductModel>>;
  findById(id: string, includeDeleted?: boolean): Promise<ProductModel>;
  findByIdPublic(id: string): Promise<ProductModel>;
  create(dto: CreateProductDto): Promise<ProductModel>;
  update(id: string, dto: UpdateProductDto): Promise<ProductModel>;
  delete(id: string): Promise<void>;
  restore(id: string): Promise<ProductModel>;
}
