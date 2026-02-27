import { CategoryModel } from '../../models/category.model';
import { CreateCategoryDto, UpdateCategoryDto } from '../../../application/dto';

export const CATEGORIES_USE_CASE = Symbol('CATEGORIES_USE_CASE');

export interface CategoriesUseCasePort {
  findAll(onlyActive?: boolean): Promise<CategoryModel[]>;
  findById(id: string): Promise<CategoryModel>;
  create(dto: CreateCategoryDto): Promise<CategoryModel>;
  update(id: string, dto: UpdateCategoryDto): Promise<CategoryModel>;
  delete(id: string): Promise<void>;
}
