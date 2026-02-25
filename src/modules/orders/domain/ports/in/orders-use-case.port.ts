import { OrderModel } from '../../models/order.model';
import { PaginatedResponseDto } from '../../../../../common/dto';
import {
  CreatePublicOrderDto,
  UpdateOrderDto,
  OrderQueryDto,
} from '../../../application/dto';

export const ORDERS_USE_CASE = Symbol('ORDERS_USE_CASE');

export interface OrdersUseCasePort {
  findAll(query: OrderQueryDto): Promise<PaginatedResponseDto<OrderModel>>;
  findById(id: string): Promise<OrderModel>;
  findByPublicId(publicId: string): Promise<OrderModel>;
  createPublicOrder(dto: CreatePublicOrderDto): Promise<OrderModel>;
  update(id: string, dto: UpdateOrderDto): Promise<OrderModel>;
  delete(id: string): Promise<void>;
  generateWhatsAppMessage(order: OrderModel, businessPhone: string): string;
  getOrderSummary(order: OrderModel): object;
}
