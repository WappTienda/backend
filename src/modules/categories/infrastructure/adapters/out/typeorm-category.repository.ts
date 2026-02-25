import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../entities/category.entity';
import { CategoryMapper } from '../../mappers/category.mapper';
import { CategoryModel } from '../../../domain/models/category.model';
import { CategoryRepositoryPort } from '../../../domain/ports/out/category-repository.port';

@Injectable()
export class TypeOrmCategoryRepository implements CategoryRepositoryPort {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async findAll(onlyActive: boolean): Promise<CategoryModel[]> {
    const where = onlyActive ? { isActive: true } : {};
    const entities = await this.categoryRepository.find({
      where,
      order: { order: 'ASC', name: 'ASC' },
    });
    return entities.map((entity) => CategoryMapper.toDomain(entity));
  }

  async findById(id: string): Promise<CategoryModel | null> {
    const entity = await this.categoryRepository.findOne({ where: { id } });
    return entity ? CategoryMapper.toDomain(entity) : null;
  }

  async findByName(name: string): Promise<CategoryModel | null> {
    const entity = await this.categoryRepository.findOne({ where: { name } });
    return entity ? CategoryMapper.toDomain(entity) : null;
  }

  async findBySlug(slug: string): Promise<CategoryModel | null> {
    const entity = await this.categoryRepository.findOne({ where: { slug } });
    return entity ? CategoryMapper.toDomain(entity) : null;
  }

  async findByNameOrSlug(
    name: string,
    slug: string,
  ): Promise<CategoryModel | null> {
    const entity = await this.categoryRepository.findOne({
      where: [{ name }, { slug }],
    });
    return entity ? CategoryMapper.toDomain(entity) : null;
  }

  async create(data: Partial<CategoryModel>): Promise<CategoryModel> {
    const entityData = CategoryMapper.toEntity(data);
    const entity = this.categoryRepository.create(entityData);
    const saved = await this.categoryRepository.save(entity);
    return CategoryMapper.toDomain(saved);
  }

  async save(category: CategoryModel): Promise<CategoryModel> {
    const entityData = CategoryMapper.toEntity(category);
    const entity = this.categoryRepository.create(entityData);
    const saved = await this.categoryRepository.save(entity);
    return CategoryMapper.toDomain(saved);
  }

  async remove(category: CategoryModel): Promise<void> {
    const entity = await this.categoryRepository.findOne({
      where: { id: category.id },
    });
    if (entity) {
      await this.categoryRepository.remove(entity);
    }
  }
}
