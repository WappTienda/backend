import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ProductModel } from '../models/product.model';
import {
  PRODUCT_REPOSITORY,
  ProductRepositoryPort,
} from '../ports/out/product-repository.port';
import { ProductsUseCasePort } from '../ports/in/products-use-case.port';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
} from '../../application/dto';
import { PaginatedResponseDto } from '../../../../common/dto';
import { CategoriesService } from '../../../categories/categories.service';

@Injectable()
export class ProductsService implements ProductsUseCasePort {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryPort,
    private readonly categoriesService: CategoriesService,
  ) {}

  async findAllPublic(
    query: ProductQueryDto,
  ): Promise<PaginatedResponseDto<ProductModel>> {
    const { page = 1, limit = 10 } = query;
    const { data, total } = await this.productRepository.findAllPublic(query);
    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findAllAdmin(
    query: ProductQueryDto,
  ): Promise<PaginatedResponseDto<ProductModel>> {
    const { page = 1, limit = 10 } = query;
    const { data, total } = await this.productRepository.findAllAdmin(query);
    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findById(id: string, includeDeleted = false): Promise<ProductModel> {
    const product = await this.productRepository.findById(id, includeDeleted);

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async findByIdPublic(id: string): Promise<ProductModel> {
    const product = await this.productRepository.findByIdPublic(id);

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async create(dto: CreateProductDto): Promise<ProductModel> {
    const existing = await this.productRepository.findBySku(dto.sku);

    if (existing) {
      throw new ConflictException(`Product with SKU ${dto.sku} already exists`);
    }

    if (dto.categoryId) {
      await this.validateCategory(dto.categoryId);
    }

    this.validatePricing(dto.price, dto.salePrice);

    return this.productRepository.create(dto);
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductModel> {
    const product = await this.findById(id);

    if (dto.categoryId) {
      await this.validateCategory(dto.categoryId);
    }

    const newPrice = dto.price ?? product.price;
    const newSalePrice =
      dto.salePrice !== undefined ? dto.salePrice : product.salePrice;
    this.validatePricing(newPrice, newSalePrice);

    Object.assign(product, dto);
    return this.productRepository.save(product);
  }

  async delete(id: string): Promise<void> {
    const product = await this.findById(id);
    await this.productRepository.softRemove(product);
  }

  async restore(id: string): Promise<ProductModel> {
    const product = await this.findById(id, true);
    if (!product.deletedAt) {
      throw new ConflictException('Product is not deleted');
    }
    await this.productRepository.restore(id);
    return this.findById(id);
  }

  /**
   * Validates that a category exists and is active
   */
  private async validateCategory(categoryId: string): Promise<void> {
    const category = await this.categoriesService.findById(categoryId);

    if (!category.isActive) {
      throw new BadRequestException(
        `Category with ID ${categoryId} is not active`,
      );
    }
  }

  /**
   * Validates pricing logic for products
   */
  private validatePricing(price: number, salePrice?: number): void {
    if (salePrice !== undefined && salePrice !== null) {
      if (salePrice < 0) {
        throw new BadRequestException('Sale price cannot be negative');
      }
      if (salePrice > price) {
        throw new BadRequestException(
          'Sale price cannot be greater than regular price',
        );
      }
    }
  }
}
