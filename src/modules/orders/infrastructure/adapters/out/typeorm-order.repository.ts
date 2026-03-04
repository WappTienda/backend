import { Injectable } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Order } from '../../entities/order.entity';
import { OrderItem } from '../../entities/order-item.entity';
import { OrderMapper } from '../../mappers/order.mapper';
import { OrderModel, OrderStatus } from '../../../domain/models/order.model';
import {
  OrderRepositoryPort,
  FindOrdersQuery,
  PaginatedOrders,
  CreatePublicOrderData,
} from '../../../domain/ports/out/order-repository.port';
import { Customer } from '../../../../customers/infrastructure/entities/customer.entity';
import { Inventory } from '../../../../inventory/infrastructure/entities/inventory.entity';

@Injectable()
export class TypeOrmOrderRepository implements OrderRepositoryPort {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(query: FindOrdersQuery): Promise<PaginatedOrders> {
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

    const [entities, total] = await qb.getManyAndCount();

    return {
      data: entities.map((entity) => OrderMapper.toDomain(entity)),
      total,
    };
  }

  async findById(id: string): Promise<OrderModel | null> {
    const entity = await this.orderRepository.findOne({
      where: { id },
      relations: ['customer', 'items', 'items.product'],
    });

    return entity ? OrderMapper.toDomain(entity) : null;
  }

  async findByPublicId(publicId: string): Promise<OrderModel | null> {
    const entity = await this.orderRepository.findOne({
      where: { publicId },
      relations: ['customer', 'items'],
    });

    return entity ? OrderMapper.toDomain(entity) : null;
  }

  async create(data: {
    customerId: string;
    customerNote?: string;
    status: string;
    totalAmount: number;
    items: Partial<OrderItem>[];
  }): Promise<OrderModel> {
    const entity = this.orderRepository.create({
      customerId: data.customerId,
      customerNote: data.customerNote,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      status: data.status as any,
      totalAmount: data.totalAmount,
      items: data.items as OrderItem[],
    });

    const saved = await this.orderRepository.save(entity);
    return OrderMapper.toDomain(saved);
  }

  async createPublicOrder(data: CreatePublicOrderData): Promise<OrderModel> {
    return this.dataSource.transaction(async (manager) => {
      // Find or create customer within the transaction
      let customer = await manager.findOne(Customer, {
        where: { phone: data.customerPhone },
      });

      if (!customer) {
        customer = manager.create(Customer, {
          name: data.customerName,
          phone: data.customerPhone,
          address: data.customerAddress,
        });
        customer = await manager.save(customer);
      } else {
        if (data.customerName) customer.name = data.customerName;
        if (data.customerAddress) customer.address = data.customerAddress;
        customer = await manager.save(customer);
      }

      // Create order with items within the same transaction
      const order = manager.create(Order, {
        customerId: customer.id,
        customerNote: data.customerNote,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        status: data.status as any,
        totalAmount: data.totalAmount,
        items: data.items as OrderItem[],
      });

      const saved = await manager.save(order);

      // Atomically reserve stock in inventory for products that track inventory
      for (const item of data.items) {
        const updateResult = await manager
          .createQueryBuilder()
          .update(Inventory)
          .set({ reservedQuantity: () => '"reservedQuantity" + :qty' })
          .where(
            '"productId" = :productId AND ("stockQuantity" - "reservedQuantity") >= :qty',
            { productId: item.productId, qty: item.quantity },
          )
          .execute();

        if (updateResult.affected === 0) {
          const inventory = await manager.findOne(Inventory, {
            where: { productId: item.productId },
          });
          if (inventory) {
            throw new BadRequestException(
              `Insufficient stock for product ${item.productName}`,
            );
          }
          // No inventory record means product does not track inventory — skip
        }
      }

      return OrderMapper.toDomain(saved);
    });
  }

  async confirmOrderAndCommitInventory(orderId: string): Promise<boolean> {
    return this.dataSource.transaction(async (manager) => {
      // Atomically transition to CONFIRMED only from a reservable state
      const updateResult = await manager
        .createQueryBuilder()
        .update(Order)
        .set({ status: OrderStatus.CONFIRMED })
        .where('"id" = :id AND "status" IN (:...statuses)', {
          id: orderId,
          statuses: [OrderStatus.PENDING, OrderStatus.CONTACTED],
        })
        .execute();

      if (updateResult.affected === 0) {
        return false;
      }

      const items = await manager.find(OrderItem, { where: { orderId } });

      for (const item of items) {
        // Commit the reservation: deduct from stockQuantity and reservedQuantity
        await manager
          .createQueryBuilder()
          .update(Inventory)
          .set({
            stockQuantity: () => '"stockQuantity" - :qty',
            reservedQuantity: () => '"reservedQuantity" - :qty',
          })
          .where(
            '"productId" = :productId AND "reservedQuantity" >= :qty AND "stockQuantity" >= :qty',
            { productId: item.productId, qty: item.quantity },
          )
          .execute();
      }

      return true;
    });
  }

  async cancelOrderAndReleaseInventory(orderId: string): Promise<boolean> {
    return this.dataSource.transaction(async (manager) => {
      // Fetch current order to determine the right inventory action
      const order = await manager.findOne(Order, { where: { id: orderId } });
      if (!order || order.status === OrderStatus.CANCELLED) {
        return false;
      }

      const previousStatus = order.status;

      // Atomically update status to CANCELLED
      await manager
        .createQueryBuilder()
        .update(Order)
        .set({ status: OrderStatus.CANCELLED })
        .where('"id" = :id', { id: orderId })
        .execute();

      const items = await manager.find(OrderItem, { where: { orderId } });

      if (
        previousStatus === OrderStatus.PENDING ||
        previousStatus === OrderStatus.CONTACTED
      ) {
        // Release reservation: decrease reservedQuantity
        for (const item of items) {
          await manager
            .createQueryBuilder()
            .update(Inventory)
            .set({ reservedQuantity: () => '"reservedQuantity" - :qty' })
            .where('"productId" = :productId AND "reservedQuantity" >= :qty', {
              productId: item.productId,
              qty: item.quantity,
            })
            .execute();
        }
      } else if (
        previousStatus === OrderStatus.CONFIRMED ||
        previousStatus === OrderStatus.DELIVERED
      ) {
        // Restore stock: reservation was already committed, so increase stockQuantity
        for (const item of items) {
          await manager
            .createQueryBuilder()
            .update(Inventory)
            .set({ stockQuantity: () => '"stockQuantity" + :qty' })
            .where('"productId" = :productId', {
              productId: item.productId,
              qty: item.quantity,
            })
            .execute();
        }
      }

      return true;
    });
  }

  async save(order: OrderModel): Promise<OrderModel> {
    const entityData = OrderMapper.toEntity(order);
    const entity = this.orderRepository.create(entityData);
    const saved = await this.orderRepository.save(entity);
    return OrderMapper.toDomain(saved);
  }

  async remove(order: OrderModel): Promise<void> {
    const entity = await this.orderRepository.findOne({
      where: { id: order.id },
    });
    if (entity) {
      await this.orderRepository.remove(entity);
    }
  }
}

