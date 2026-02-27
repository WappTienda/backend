import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Order } from '../../entities/order.entity';
import { OrderItem } from '../../entities/order-item.entity';
import { OrderMapper } from '../../mappers/order.mapper';
import { OrderModel } from '../../../domain/models/order.model';
import {
  OrderRepositoryPort,
  FindOrdersQuery,
  PaginatedOrders,
  CreatePublicOrderData,
} from '../../../domain/ports/out/order-repository.port';
import { Customer } from '../../../../customers/infrastructure/entities/customer.entity';

@Injectable()
export class TypeOrmOrderRepository implements OrderRepositoryPort {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
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
      return OrderMapper.toDomain(saved);
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
