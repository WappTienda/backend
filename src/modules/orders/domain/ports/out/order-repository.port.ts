import { OrderModel } from '../../models/order.model';
import { OrderItem } from '../../../infrastructure/entities/order-item.entity';

export interface FindOrdersQuery {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export interface PaginatedOrders {
  data: OrderModel[];
  total: number;
}

export interface CreatePublicOrderData {
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  customerNote?: string;
  status: string;
  totalAmount: number;
  items: {
    productId: string;
    productName: string;
    productSku: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
}

export const ORDER_REPOSITORY = Symbol('ORDER_REPOSITORY');

export interface OrderRepositoryPort {
  findAll(query: FindOrdersQuery): Promise<PaginatedOrders>;
  findById(id: string): Promise<OrderModel | null>;
  findByPublicId(publicId: string): Promise<OrderModel | null>;
  create(data: {
    customerId: string;
    customerNote?: string;
    status: string;
    totalAmount: number;
    items: Partial<OrderItem>[];
  }): Promise<OrderModel>;
  createPublicOrder(data: CreatePublicOrderData): Promise<OrderModel>;
  save(order: OrderModel): Promise<OrderModel>;
  remove(order: OrderModel): Promise<void>;
}
