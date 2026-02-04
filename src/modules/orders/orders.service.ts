import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreatePublicOrderDto, UpdateOrderDto, OrderQueryDto } from './dto';
import { CustomersService } from '../customers/customers.service';
import { ProductsService } from '../products/products.service';
import { PaginatedResponseDto } from '../../common/dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    private readonly customersService: CustomersService,
    private readonly productsService: ProductsService,
  ) {}

  async findAll(query: OrderQueryDto): Promise<PaginatedResponseDto<Order>> {
    const { page = 1, limit = 10, status, search } = query;

    const qb = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.items', 'items');

    if (status) {
      qb.andWhere('order.status = :status', { status });
    }

    if (search) {
      qb.andWhere(
        '(order.publicId ILIKE :search OR customer.name ILIKE :search OR customer.phone ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    qb.orderBy('order.createdAt', 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findById(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['customer', 'items', 'items.product'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async findByPublicId(publicId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { publicId },
      relations: ['customer', 'items'],
    });

    if (!order) {
      throw new NotFoundException(`Order not found`);
    }

    return order;
  }

  async createPublicOrder(dto: CreatePublicOrderDto): Promise<Order> {
    // Find or create customer
    const customer = await this.customersService.findOrCreate({
      name: dto.customerName,
      phone: dto.customerPhone,
      address: dto.customerAddress,
    });

    // Validate products and create order items
    const orderItems: Partial<OrderItem>[] = [];
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

    // Create order
    const order = this.orderRepository.create({
      customerId: customer.id,
      customerNote: dto.customerNote,
      status: OrderStatus.PENDING,
      totalAmount,
      items: orderItems as OrderItem[],
    });

    const savedOrder = await this.orderRepository.save(order);

    return this.findById(savedOrder.id);
  }

  async update(id: string, dto: UpdateOrderDto): Promise<Order> {
    const order = await this.findById(id);
    Object.assign(order, dto);
    await this.orderRepository.save(order);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    const order = await this.findById(id);
    await this.orderRepository.remove(order);
  }

  generateWhatsAppMessage(order: Order, businessPhone: string): string {
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

  getOrderSummary(order: Order): object {
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
