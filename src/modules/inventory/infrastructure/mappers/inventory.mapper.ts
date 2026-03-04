import { InventoryModel } from '../../domain/models/inventory.model';
import { Inventory } from '../entities/inventory.entity';

export class InventoryMapper {
  static toDomain(entity: Inventory): InventoryModel {
    const model = new InventoryModel();
    model.id = entity.id;
    model.productId = entity.productId;
    model.stockQuantity = entity.stockQuantity;
    model.reservedQuantity = entity.reservedQuantity;
    model.createdAt = entity.createdAt;
    model.updatedAt = entity.updatedAt;
    return model;
  }
}
