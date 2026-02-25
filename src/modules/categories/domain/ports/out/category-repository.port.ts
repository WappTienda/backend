import { CategoryModel } from '../../models/category.model';

export const CATEGORY_REPOSITORY = Symbol('CATEGORY_REPOSITORY');

export interface CategoryRepositoryPort {
  findAll(onlyActive: boolean): Promise<CategoryModel[]>;
  findById(id: string): Promise<CategoryModel | null>;
  findByName(name: string): Promise<CategoryModel | null>;
  findBySlug(slug: string): Promise<CategoryModel | null>;
  findByNameOrSlug(name: string, slug: string): Promise<CategoryModel | null>;
  create(data: Partial<CategoryModel>): Promise<CategoryModel>;
  save(category: CategoryModel): Promise<CategoryModel>;
  remove(category: CategoryModel): Promise<void>;
}
