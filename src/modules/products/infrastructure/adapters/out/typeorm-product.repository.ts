import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../entities/product.entity';
import { ProductMapper } from '../../mappers/product.mapper';
import { ProductModel } from '../../../domain/models/product.model';
import {
  ProductRepositoryPort,
  FindProductsQuery,
  PaginatedProducts,
} from '../../../domain/ports/out/product-repository.port';

@Injectable()
export class TypeOrmProductRepository implements ProductRepositoryPort {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async findAllPublic(query: FindProductsQuery): Promise<PaginatedProducts> {
    const { page = 1, limit = 10, categoryId, search, onlyInStock } = query;

    const qb = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.images', 'images')
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

    const [entities, total] = await qb.getManyAndCount();

    return {
      data: entities.map((entity) => ProductMapper.toDomain(entity)),
      total,
    };
  }

  async findAllAdmin(query: FindProductsQuery): Promise<PaginatedProducts> {
    const { page = 1, limit = 10, categoryId, search } = query;

    const qb = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.images', 'images')
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

    const [entities, total] = await qb.getManyAndCount();

    return {
      data: entities.map((entity) => ProductMapper.toDomain(entity)),
      total,
    };
  }

  async findById(
    id: string,
    includeDeleted = false,
  ): Promise<ProductModel | null> {
    const qb = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.images', 'images')
      .where('product.id = :id', { id });

    if (includeDeleted) {
      qb.withDeleted();
    }

    const entity = await qb.getOne();
    return entity ? ProductMapper.toDomain(entity) : null;
  }

  async findByIdPublic(id: string): Promise<ProductModel | null> {
    const entity = await this.productRepository.findOne({
      where: { id, isVisible: true, isActive: true },
      relations: ['category', 'images'],
    });

    return entity ? ProductMapper.toDomain(entity) : null;
  }

  async findBySku(sku: string): Promise<ProductModel | null> {
    const entity = await this.productRepository.findOne({
      where: { sku },
      withDeleted: true,
    });

    return entity ? ProductMapper.toDomain(entity) : null;
  }

  async create(data: Partial<ProductModel>): Promise<ProductModel> {
    const entityData = ProductMapper.toEntity(data);
    const entity = this.productRepository.create(entityData);
    const saved = await this.productRepository.save(entity);
    return ProductMapper.toDomain(saved);
  }

  async save(product: ProductModel): Promise<ProductModel> {
    const entityData = ProductMapper.toEntity(product);
    const entity = this.productRepository.create(entityData);
    const saved = await this.productRepository.save(entity);
    return ProductMapper.toDomain(saved);
  }

  async softRemove(product: ProductModel): Promise<void> {
    const entity = await this.productRepository.findOne({
      where: { id: product.id },
    });
    if (entity) {
      await this.productRepository.softRemove(entity);
    }
  }

  async restore(id: string): Promise<void> {
    await this.productRepository.restore(id);
  }
}
