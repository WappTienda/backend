import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { OrderModel, OrderStatus } from '../models/order.model';
import {
  ORDER_REPOSITORY,
  OrderRepositoryPort,
} from '../ports/out/order-repository.port';
import { OrdersUseCasePort } from '../ports/in/orders-use-case.port';
import {
  CreatePublicOrderDto,
  UpdateOrderDto,
  OrderQueryDto,
} from '../../application/dto';
import { PaginatedResponseDto } from '../../../../common/dto';
import { ProductsService } from '../../../products';

@Injectable()
export class OrdersService implements OrdersUseCasePort {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepositoryPort,
    private readonly productsService: ProductsService,
  ) {}

  async findAll(
    query: OrderQueryDto,
  ): Promise<PaginatedResponseDto<OrderModel>> {
    const { page = 1, limit = 10 } = query;
    const { data, total } = await this.orderRepository.findAll(query);
    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findById(id: string): Promise<OrderModel> {
    const order = await this.orderRepository.findById(id);

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async findByPublicId(publicId: string): Promise<OrderModel> {
    const order = await this.orderRepository.findByPublicId(publicId);

    if (!order) {
      throw new NotFoundException(`Order not found`);
    }

    return order;
  }

  async createPublicOrder(dto: CreatePublicOrderDto): Promise<OrderModel> {
    // Validate products and build order items (read-only, before transaction)
    const orderItems: {
      productId: string;
      productName: string;
      productSku: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }[] = [];
    let totalAmount = 0;

    for (const itemDto of dto.items) {
      const product = await this.productsService.findByIdPublic(
        itemDto.productId,
      );

      if (!product.isInStock) {
        throw new BadRequestException(
          `Product ${product.name} is out of stock`,
        );
      }

      if (product.trackInventory && product.stockQuantity < itemDto.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product ${product.name}`,
        );
      }

      const unitPrice =
        product.salePrice && product.salePrice > 0
          ? product.salePrice
          : product.price;
      const subtotal = Number(unitPrice) * itemDto.quantity;

      orderItems.push({
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        quantity: itemDto.quantity,
        unitPrice: Number(unitPrice),
        subtotal,
      });

      totalAmount += subtotal;
    }

    // Create customer and order atomically in a single transaction
    const savedOrder = await this.orderRepository.createPublicOrder({
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      customerAddress: dto.customerAddress,
      customerNote: dto.customerNote,
      status: OrderStatus.PENDING,
      totalAmount,
      items: orderItems,
    });

    return this.findById(savedOrder.id);
  }

  async update(id: string, dto: UpdateOrderDto): Promise<OrderModel> {
    const order = await this.findById(id);
    Object.assign(order, dto);
    await this.orderRepository.save(order);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    const order = await this.findById(id);
    await this.orderRepository.remove(order);
  }

  generateWhatsAppMessage(order: OrderModel, businessPhone: string): string {
    const itemsText = order.items
      .map(
        (item) =>
          `• ${item.quantity}x ${item.productName} - $${Number(item.subtotal).toFixed(2)}`,
      )
      .join('\n');

    const message =
      `🛒 *Nuevo Pedido #${order.publicId}*\n\n` +
      `👤 *Cliente:* ${order.customer?.name || 'N/A'}\n` +
      `📱 *Teléfono:* ${order.customer?.phone || 'N/A'}\n` +
      `${order.customer?.address ? `📍 *Dirección:* ${order.customer.address}\n` : ''}` +
      `\n📦 *Productos:*\n${itemsText}\n\n` +
      `💰 *Total:* $${Number(order.totalAmount).toFixed(2)}\n` +
      `${order.customerNote ? `\n📝 *Nota:* ${order.customerNote}` : ''}`;

    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${businessPhone.replace(/[^0-9]/g, '')}?text=${encodedMessage}`;
  }

  getOrderSummary(order: OrderModel): object {
    return {
      orderId: order.publicId,
      status: order.status,
      customer: order.customer
        ? {
            name: order.customer.name,
            phone: order.customer.phone,
            address: order.customer.address,
          }
        : null,
      items: order.items.map((item) => ({
        name: item.productName,
        sku: item.productSku,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        subtotal: Number(item.subtotal),
      })),
      totalAmount: Number(order.totalAmount),
      customerNote: order.customerNote,
      createdAt: order.createdAt,
    };
  }
}
