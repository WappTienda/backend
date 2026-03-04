export class InventoryModel {
  id: string;
  productId: string;
  stockQuantity: number;
  reservedQuantity: number;
  createdAt: Date;
  updatedAt: Date;

  get availableQuantity(): number {
    return this.stockQuantity - this.reservedQuantity;
  }
}
