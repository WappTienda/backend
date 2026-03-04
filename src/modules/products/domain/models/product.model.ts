export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  order?: number;
  isActive: boolean;
}

export interface ProductImageModel {
  id?: string;
  productId?: string;
  url: string;
  order: number;
  alt: string | null;
}

export class ProductModel {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  salePrice: number;
  imageUrl: string;
  images: ProductImageModel[];
  categoryId: string;
  category: ProductCategory | null;
  stockQuantity: number;
  trackInventory: boolean;
  isVisible: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  get effectivePrice(): number {
    return this.salePrice && this.salePrice > 0 ? this.salePrice : this.price;
  }

  get isInStock(): boolean {
    if (!this.trackInventory) return true;
    return this.stockQuantity > 0;
  }
}
