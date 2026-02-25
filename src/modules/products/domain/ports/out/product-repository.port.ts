import { ProductModel } from '../../models/product.model';

export interface FindProductsQuery {
  page?: number;
  limit?: number;
  categoryId?: string;
  search?: string;
  onlyInStock?: boolean;
}

export interface PaginatedProducts {
  data: ProductModel[];
  total: number;
}

export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');

export interface ProductRepositoryPort {
  findAllPublic(query: FindProductsQuery): Promise<PaginatedProducts>;
  findAllAdmin(query: FindProductsQuery): Promise<PaginatedProducts>;
  findById(id: string, includeDeleted?: boolean): Promise<ProductModel | null>;
  findByIdPublic(id: string): Promise<ProductModel | null>;
  findBySku(sku: string): Promise<ProductModel | null>;
  create(data: Partial<ProductModel>): Promise<ProductModel>;
  save(product: ProductModel): Promise<ProductModel>;
  softRemove(product: ProductModel): Promise<void>;
  restore(id: string): Promise<void>;
}
