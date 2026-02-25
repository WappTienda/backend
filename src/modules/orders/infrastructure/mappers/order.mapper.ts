import { OrderModel, OrderItemModel } from '../../domain/models/order.model';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';

export class OrderMapper {
  static toDomain(entity: Order): OrderModel {
    const model = new OrderModel();
    model.id = entity.id;
    model.publicId = entity.publicId;
    model.customerId = entity.customerId;
    model.customer = entity.customer
      ? {
          name: entity.customer.name,
          phone: entity.customer.phone,
          address: entity.customer.address,
        }
      : null;
    model.status = entity.status;
    model.totalAmount = entity.totalAmount;
    model.customerNote = entity.customerNote;
    model.adminNote = entity.adminNote;
    model.items = entity.items
      ? entity.items.map((item) => OrderMapper.itemToDomain(item))
      : [];
    model.createdAt = entity.createdAt;
    model.updatedAt = entity.updatedAt;
    return model;
  }

  static itemToDomain(entity: OrderItem): OrderItemModel {
    const model = new OrderItemModel();
    model.id = entity.id;
    model.orderId = entity.orderId;
    model.productId = entity.productId;
    model.productName = entity.productName;
    model.productSku = entity.productSku;
    model.quantity = entity.quantity;
    model.unitPrice = entity.unitPrice;
    model.subtotal = entity.subtotal;
    return model;
  }

  static toEntity(model: Partial<OrderModel>): Partial<Order> {
    const entity: Partial<Order> = {};
    if (model.id !== undefined) entity.id = model.id;
    if (model.publicId !== undefined) entity.publicId = model.publicId;
    if (model.customerId !== undefined) entity.customerId = model.customerId;
    if (model.status !== undefined) entity.status = model.status;
    if (model.totalAmount !== undefined) entity.totalAmount = model.totalAmount;
    if (model.customerNote !== undefined)
      entity.customerNote = model.customerNote;
    if (model.adminNote !== undefined) entity.adminNote = model.adminNote;
    return entity;
  }
}
