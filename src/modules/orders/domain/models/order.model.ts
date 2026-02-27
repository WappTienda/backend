export enum OrderStatus {
  PENDING = 'pending',
  CONTACTED = 'contacted',
  CONFIRMED = 'confirmed',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export interface OrderCustomer {
  name: string;
  phone: string;
  address?: string;
}

export class OrderItemModel {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export class OrderModel {
  id: string;
  publicId: string;
  customerId: string;
  customer: OrderCustomer | null;
  status: OrderStatus;
  totalAmount: number;
  customerNote: string;
  adminNote: string;
  items: OrderItemModel[];
  createdAt: Date;
  updatedAt: Date;

  calculateTotal(): number {
    if (!this.items || this.items.length === 0) return 0;
    return this.items.reduce((sum, item) => sum + Number(item.subtotal), 0);
  }
}
