import { CategoryModel } from '../../domain/models/category.model';
import { Category } from '../entities/category.entity';

export class CategoryMapper {
  static toDomain(entity: Category): CategoryModel {
    const model = new CategoryModel();
    model.id = entity.id;
    model.name = entity.name;
    model.slug = entity.slug;
    model.description = entity.description;
    model.order = entity.order;
    model.isActive = entity.isActive;
    model.createdAt = entity.createdAt;
    model.updatedAt = entity.updatedAt;
    return model;
  }

  static toEntity(model: Partial<CategoryModel>): Partial<Category> {
    const entity: Partial<Category> = {};
    if (model.id !== undefined) entity.id = model.id;
    if (model.name !== undefined) entity.name = model.name;
    if (model.slug !== undefined) entity.slug = model.slug;
    if (model.description !== undefined) entity.description = model.description;
    if (model.order !== undefined) entity.order = model.order;
    if (model.isActive !== undefined) entity.isActive = model.isActive;
    return entity;
  }
}
