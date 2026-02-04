import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { Product } from '../products/entities/product.entity';
import { Customer } from '../customers/entities/customer.entity';

export interface DashboardStats {
  orders: {
    total: number;
    pending: number;
    confirmed: number;
    delivered: number;
    cancelled: number;
  };
  revenue: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  products: {
    total: number;
    visible: number;
    outOfStock: number;
  };
  customers: {
    total: number;
  };
}

export interface OrderStats {
  byStatus: Record<string, number>;
  byDate: { date: string; count: number; total: number }[];
}

export interface TopProduct {
  productId: string;
  productName: string;
  productSku: string;
  totalQuantity: number;
  totalRevenue: number;
}

interface StatusCountRaw {
  status: string;
  count: string;
}

interface DateStatsRaw {
  date: string;
  count: string;
  total: string;
}

interface RevenueRaw {
  total: string | null;
}

interface TopProductRaw {
  productId: string;
  productName: string;
  productSku: string;
  totalQuantity: string;
  totalRevenue: string;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async getDashboard(): Promise<DashboardStats> {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Orders stats
    const ordersTotal = await this.orderRepository.count();
    const ordersByStatus: StatusCountRaw[] = await this.orderRepository
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('order.status')
      .getRawMany();

    const statusCounts = ordersByStatus.reduce(
      (acc, item) => {
        acc[item.status] = parseInt(item.count);
        return acc;
      },
      {} as Record<string, number>,
    );

    // Revenue stats
    const revenueTotal: RevenueRaw | undefined = await this.orderRepository
      .createQueryBuilder('order')
      .where('order.status != :cancelled', { cancelled: OrderStatus.CANCELLED })
      .select('SUM(order.totalAmount)', 'total')
      .getRawOne();

    const revenueToday = await this.getRevenueForPeriod(startOfToday, now);
    const revenueWeek = await this.getRevenueForPeriod(startOfWeek, now);
    const revenueMonth = await this.getRevenueForPeriod(startOfMonth, now);

    // Products stats
    const productsTotal = await this.productRepository.count();
    const productsVisible = await this.productRepository.count({
      where: { isVisible: true, isActive: true },
    });
    const productsOutOfStock = await this.productRepository
      .createQueryBuilder('product')
      .where('product.trackInventory = :track', { track: true })
      .andWhere('product.stockQuantity <= 0')
      .getCount();

    // Customers stats
    const customersTotal = await this.customerRepository.count();

    return {
      orders: {
        total: ordersTotal,
        pending: statusCounts[OrderStatus.PENDING] || 0,
        confirmed: statusCounts[OrderStatus.CONFIRMED] || 0,
        delivered: statusCounts[OrderStatus.DELIVERED] || 0,
        cancelled: statusCounts[OrderStatus.CANCELLED] || 0,
      },
      revenue: {
        total: parseFloat(revenueTotal?.total ?? '0') || 0,
        today: revenueToday,
        thisWeek: revenueWeek,
        thisMonth: revenueMonth,
      },
      products: {
        total: productsTotal,
        visible: productsVisible,
        outOfStock: productsOutOfStock,
      },
      customers: {
        total: customersTotal,
      },
    };
  }

  async getOrderStats(days = 30): Promise<OrderStats> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // By status
    const byStatusRaw: StatusCountRaw[] = await this.orderRepository
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('order.status')
      .getRawMany();

    const byStatus = byStatusRaw.reduce(
      (acc, item) => {
        acc[item.status] = parseInt(item.count);
        return acc;
      },
      {} as Record<string, number>,
    );

    // By date
    const byDateRaw: DateStatsRaw[] = await this.orderRepository
      .createQueryBuilder('order')
      .select('DATE(order.createdAt)', 'date')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(order.totalAmount)', 'total')
      .where('order.createdAt >= :startDate', { startDate })
      .groupBy('DATE(order.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    const byDate = byDateRaw.map((item) => ({
      date: item.date,
      count: parseInt(item.count),
      total: parseFloat(item.total) || 0,
    }));

    return { byStatus, byDate };
  }

  async getTopProducts(limit = 10): Promise<TopProduct[]> {
    const result: TopProductRaw[] = await this.orderRepository
      .createQueryBuilder('order')
      .innerJoin('order.items', 'item')
      .select('item.productId', 'productId')
      .addSelect('item.productName', 'productName')
      .addSelect('item.productSku', 'productSku')
      .addSelect('SUM(item.quantity)', 'totalQuantity')
      .addSelect('SUM(item.subtotal)', 'totalRevenue')
      .where('order.status != :cancelled', { cancelled: OrderStatus.CANCELLED })
      .groupBy('item.productId')
      .addGroupBy('item.productName')
      .addGroupBy('item.productSku')
      .orderBy('totalQuantity', 'DESC')
      .limit(limit)
      .getRawMany();

    return result.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      productSku: item.productSku,
      totalQuantity: parseInt(item.totalQuantity),
      totalRevenue: parseFloat(item.totalRevenue) || 0,
    }));
  }

  private async getRevenueForPeriod(start: Date, end: Date): Promise<number> {
    const result: RevenueRaw | undefined = await this.orderRepository
      .createQueryBuilder('order')
      .where('order.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere('order.status != :cancelled', {
        cancelled: OrderStatus.CANCELLED,
      })
      .select('SUM(order.totalAmount)', 'total')
      .getRawOne();

    return parseFloat(result?.total ?? '0') || 0;
  }
}
