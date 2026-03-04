export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  order?: number;
  isActive: boolean;
}

export class ProductModel {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  salePrice: number;
  imageUrl: string;
  categoryId: string;
  category: ProductCategory | null;
  trackInventory: boolean;
  isVisible: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  get effectivePrice(): number {
    return this.salePrice && this.salePrice > 0 ? this.salePrice : this.price;
  }
}
