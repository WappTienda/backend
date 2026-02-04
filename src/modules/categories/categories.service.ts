import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async findAll(onlyActive = false): Promise<Category[]> {
    const where = onlyActive ? { isActive: true } : {};
    return this.categoryRepository.find({
      where,
      order: { order: 'ASC', name: 'ASC' },
    });
  }

  async findById(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const slug = dto.slug || this.generateSlug(dto.name);

    const existing = await this.categoryRepository.findOne({
      where: [{ name: dto.name }, { slug }],
    });

    if (existing) {
      throw new ConflictException(
        'Category with this name or slug already exists',
      );
    }

    const category = this.categoryRepository.create({
      ...dto,
      slug,
    });

    return this.categoryRepository.save(category);
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findById(id);

    if (dto.name && dto.name !== category.name) {
      const existing = await this.categoryRepository.findOne({
        where: { name: dto.name },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    if (dto.slug && dto.slug !== category.slug) {
      const existing = await this.categoryRepository.findOne({
        where: { slug: dto.slug },
      });
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
