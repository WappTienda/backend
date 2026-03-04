import { InventoryModel } from '../../models/inventory.model';

export interface FindInventoryQuery {
  page?: number;
  limit?: number;
  productId?: string;
}

export interface PaginatedInventory {
  data: InventoryModel[];
  total: number;
}

export const INVENTORY_REPOSITORY = Symbol('INVENTORY_REPOSITORY');

export interface InventoryRepositoryPort {
  findAll(query: FindInventoryQuery): Promise<PaginatedInventory>;
  findByProductId(productId: string): Promise<InventoryModel | null>;
  upsertForProduct(
    productId: string,
    stockQuantity: number,
  ): Promise<InventoryModel>;
  adjustStock(productId: string, delta: number): Promise<InventoryModel>;
  syncStock(productId: string, newStockQuantity: number): Promise<InventoryModel>;
}
