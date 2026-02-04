import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto';
import { PaginatedResponseDto } from '../../common/dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async findAllPublic(
    query: ProductQueryDto,
  ): Promise<PaginatedResponseDto<Product>> {
    const { page = 1, limit = 10, categoryId, search, onlyInStock } = query;

    const qb = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.isVisible = :isVisible', { isVisible: true })
      .andWhere('product.isActive = :isActive', { isActive: true });

    if (categoryId) {
      qb.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    if (search) {
      qb.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search OR product.sku ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (onlyInStock) {
      qb.andWhere(
        '(product.trackInventory = false OR product.stockQuantity > 0)',
      );
    }

    qb.orderBy('product.name', 'ASC');
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findAllAdmin(
    query: ProductQueryDto,
  ): Promise<PaginatedResponseDto<Product>> {
    const { page = 1, limit = 10, categoryId, search } = query;

    const qb = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .withDeleted();

    if (categoryId) {
      qb.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    if (search) {
      qb.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search OR product.sku ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    qb.orderBy('product.createdAt', 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findById(id: string, includeDeleted = false): Promise<Product> {
    const qb = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.id = :id', { id });

    if (includeDeleted) {
      qb.withDeleted();
    }

    const product = await qb.getOne();

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async findByIdPublic(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id, isVisible: true, isActive: true },
      relations: ['category'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const existing = await this.productRepository.findOne({
      where: { sku: dto.sku },
      withDeleted: true,
    });

    if (existing) {
      throw new ConflictException(`Product with SKU ${dto.sku} already exists`);
    }

    const product = this.productRepository.create(dto);
    return this.productRepository.save(product);
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findById(id);
    Object.assign(product, dto);
    return this.productRepository.save(product);
  }

  async delete(id: string): Promise<void> {
    const product = await this.findById(id);
    await this.productRepository.softRemove(product);
  }

  async restore(id: string): Promise<Product> {
    const product = await this.findById(id, true);
    if (!product.deletedAt) {
      throw new ConflictException('Product is not deleted');
    }
    await this.productRepository.restore(id);
    return this.findById(id);
  }
}
