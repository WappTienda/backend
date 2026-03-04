import { ProductModel } from '../../domain/models/product.model';
import { Product } from '../entities/product.entity';
import { ProductImage } from '../entities/product-image.entity';

export class ProductMapper {
  static toDomain(entity: Product): ProductModel {
    const model = new ProductModel();
    model.id = entity.id;
    model.sku = entity.sku;
    model.name = entity.name;
    model.description = entity.description;
    model.price = entity.price;
    model.salePrice = entity.salePrice;
    model.imageUrl = entity.imageUrl;
    model.images = entity.images
      ? entity.images
          .sort((a, b) => a.order - b.order)
          .map((img) => ({
            id: img.id,
            productId: img.productId,
            url: img.url,
            order: img.order,
            alt: img.alt ?? null,
          }))
      : [];
    model.categoryId = entity.categoryId;
    model.category = entity.category
      ? {
          id: entity.category.id,
          name: entity.category.name,
          slug: entity.category.slug,
          description: entity.category.description,
          order: entity.category.order,
          isActive: entity.category.isActive,
        }
      : null;
    model.stockQuantity = entity.stockQuantity;
    model.trackInventory = entity.trackInventory;
    model.isVisible = entity.isVisible;
    model.isActive = entity.isActive;
    model.createdAt = entity.createdAt;
    model.updatedAt = entity.updatedAt;
    model.deletedAt = entity.deletedAt;
    return model;
  }

  static toEntity(model: Partial<ProductModel>): Partial<Product> {
    const entity: Partial<Product> = {};
    if (model.id !== undefined) entity.id = model.id;
    if (model.sku !== undefined) entity.sku = model.sku;
    if (model.name !== undefined) entity.name = model.name;
    if (model.description !== undefined) entity.description = model.description;
    if (model.price !== undefined) entity.price = model.price;
    if (model.salePrice !== undefined) entity.salePrice = model.salePrice;
    if (model.imageUrl !== undefined) entity.imageUrl = model.imageUrl;
    if (model.images !== undefined) {
      entity.images = model.images.map((img) => {
        const imageEntity = new ProductImage();
        if (img.id) imageEntity.id = img.id;
        if (img.productId) imageEntity.productId = img.productId;
        imageEntity.url = img.url;
        imageEntity.order = img.order ?? 0;
        imageEntity.alt = img.alt ?? null;
        return imageEntity;
      });
    }
    if (model.categoryId !== undefined) entity.categoryId = model.categoryId;
    if (model.stockQuantity !== undefined)
      entity.stockQuantity = model.stockQuantity;
    if (model.trackInventory !== undefined)
      entity.trackInventory = model.trackInventory;
    if (model.isVisible !== undefined) entity.isVisible = model.isVisible;
    if (model.isActive !== undefined) entity.isActive = model.isActive;
    return entity;
  }
}
