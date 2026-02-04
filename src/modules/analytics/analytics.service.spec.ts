/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsService, DashboardStats } from './analytics.service';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { Product } from '../products/entities/product.entity';
import { Customer } from '../customers/entities/customer.entity';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let orderRepository: any;
  let productRepository: jest.Mocked<Repository<Product>>;
  let customerRepository: jest.Mocked<Repository<Customer>>;

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
    getRawOne: jest.fn(),
    getCount: jest.fn(),
  };

  beforeEach(async () => {
    const mockOrderRepository = {
      count: jest.fn(),
      createQueryBuilder: jest.fn(() => mockQueryBuilder),
    };

    const mockProductRepository = {
      count: jest.fn(),
      createQueryBuilder: jest.fn(() => mockQueryBuilder),
    };

    const mockCustomerRepository = {
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: getRepositoryToken(Order), useValue: mockOrderRepository },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        {
          provide: getRepositoryToken(Customer),
          useValue: mockCustomerRepository,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    orderRepository = module.get(getRepositoryToken(Order));
    productRepository = module.get(getRepositoryToken(Product));
    customerRepository = module.get(getRepositoryToken(Customer));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboard', () => {
    it('should return dashboard statistics', async () => {
      orderRepository.count.mockResolvedValue(100);
      mockQueryBuilder.getRawMany.mockResolvedValue([
        { status: OrderStatus.PENDING, count: '30' },
        { status: OrderStatus.CONFIRMED, count: '40' },
        { status: OrderStatus.DELIVERED, count: '20' },
        { status: OrderStatus.CANCELLED, count: '10' },
      ]);
      mockQueryBuilder.getRawOne.mockResolvedValue({ total: '5000.00' });
      productRepository.count.mockResolvedValueOnce(50);
      productRepository.count.mockResolvedValueOnce(45);
      mockQueryBuilder.getCount.mockResolvedValue(5);
      customerRepository.count.mockResolvedValue(200);

      const result = await service.getDashboard();

      expect(result).toHaveProperty('orders');
      expect(result).toHaveProperty('revenue');
      expect(result).toHaveProperty('products');
      expect(result).toHaveProperty('customers');
      expect(result.orders.total).toBe(100);
    });

    it('should handle empty data gracefully', async () => {
      orderRepository.count.mockResolvedValue(0);
      mockQueryBuilder.getRawMany.mockResolvedValue([]);
      mockQueryBuilder.getRawOne.mockResolvedValue({ total: null });
      productRepository.count.mockResolvedValue(0);
      mockQueryBuilder.getCount.mockResolvedValue(0);
      customerRepository.count.mockResolvedValue(0);

      const result = await service.getDashboard();

      expect(result.orders.total).toBe(0);
      expect(result.revenue.total).toBe(0);
      expect(result.products.total).toBe(0);
      expect(result.customers.total).toBe(0);
    });
  });

  describe('getOrderStats', () => {
    it('should return order statistics for the given period', async () => {
      mockQueryBuilder.getRawMany.mockResolvedValueOnce([
        { status: OrderStatus.PENDING, count: '10' },
        { status: OrderStatus.CONFIRMED, count: '20' },
      ]);
      mockQueryBuilder.getRawMany.mockResolvedValueOnce([
        { date: '2024-01-01', count: '5', total: '500.00' },
        { date: '2024-01-02', count: '8', total: '800.00' },
      ]);

      const result = await service.getOrderStats(30);

      expect(result).toHaveProperty('byStatus');
      expect(result).toHaveProperty('byDate');
      expect(result.byStatus[OrderStatus.PENDING]).toBe(10);
      expect(result.byDate).toHaveLength(2);
    });

    it('should use default 30 days period', async () => {
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      await service.getOrderStats();

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'order.createdAt >= :startDate',
        expect.any(Object),
      );
    });
  });

  describe('getTopProducts', () => {
    it('should return top selling products', async () => {
      mockQueryBuilder.getRawMany.mockResolvedValue([
        {
          productId: 'prod-1',
          productName: 'Product 1',
          productSku: 'SKU-001',
          totalQuantity: '100',
          totalRevenue: '10000.00',
        },
        {
          productId: 'prod-2',
          productName: 'Product 2',
          productSku: 'SKU-002',
          totalQuantity: '80',
          totalRevenue: '8000.00',
        },
      ]);

      const result = await service.getTopProducts(10);

      expect(result).toHaveLength(2);
      expect(result[0].totalQuantity).toBe(100);
      expect(result[0].totalRevenue).toBe(10000);
    });

    it('should return empty array when no products sold', async () => {
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      const result = await service.getTopProducts();

      expect(result).toEqual([]);
    });
  });
});
