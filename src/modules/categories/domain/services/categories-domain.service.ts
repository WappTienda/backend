import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CategoryModel } from '../models/category.model';
import {
  CATEGORY_REPOSITORY,
  CategoryRepositoryPort,
} from '../ports/out/category-repository.port';
import { CategoriesUseCasePort } from '../ports/in/categories-use-case.port';
import { CreateCategoryDto, UpdateCategoryDto } from '../../application/dto';

@Injectable()
export class CategoriesService implements CategoriesUseCasePort {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: CategoryRepositoryPort,
  ) {}

  async findAll(onlyActive = false): Promise<CategoryModel[]> {
    return this.categoryRepository.findAll(onlyActive);
  }

  async findById(id: string): Promise<CategoryModel> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async create(dto: CreateCategoryDto): Promise<CategoryModel> {
    const slug = dto.slug || this.generateSlug(dto.name);

    const existing = await this.categoryRepository.findByNameOrSlug(
      dto.name,
      slug,
    );

    if (existing) {
      throw new ConflictException(
        'Category with this name or slug already exists',
      );
    }

    return this.categoryRepository.create({
      ...dto,
      slug,
    });
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryModel> {
    const category = await this.findById(id);

    if (dto.name && dto.name !== category.name) {
      const existing = await this.categoryRepository.findByName(dto.name);
      if (existing && existing.id !== id) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    if (dto.slug && dto.slug !== category.slug) {
      const existing = await this.categoryRepository.findBySlug(dto.slug);
      if (existing && existing.id !== id) {
        throw new ConflictException('Category with this slug already exists');
      }
    }

    Object.assign(category, dto);
    return this.categoryRepository.save(category);
  }

  async delete(id: string): Promise<void> {
    const category = await this.findById(id);
    await this.categoryRepository.remove(category);
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
