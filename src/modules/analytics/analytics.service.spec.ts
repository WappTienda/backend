/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './domain/services/analytics-domain.service';
import {
  DashboardStats,
  OrderStats,
  TopProduct,
} from './domain/models/analytics.model';
import {
  ANALYTICS_REPOSITORY,
  AnalyticsRepositoryPort,
} from './domain/ports/out/analytics-repository.port';
import { OrderStatus } from '../orders/domain/models/order.model';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let analyticsRepository: jest.Mocked<AnalyticsRepositoryPort>;

  beforeEach(async () => {
    const mockAnalyticsRepository: jest.Mocked<AnalyticsRepositoryPort> = {
      getDashboardStats: jest.fn(),
      getOrderStats: jest.fn(),
      getTopProducts: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: ANALYTICS_REPOSITORY,
          useValue: mockAnalyticsRepository,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    analyticsRepository = module.get(ANALYTICS_REPOSITORY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboard', () => {
    it('should return dashboard statistics', async () => {
      const dashboardStats: DashboardStats = {
        orders: {
          total: 100,
          pending: 30,
          confirmed: 40,
          delivered: 20,
          cancelled: 10,
        },
        revenue: {
          total: 5000,
          today: 500,
          thisWeek: 2000,
          thisMonth: 4000,
        },
        products: {
          total: 50,
          visible: 45,
          outOfStock: 5,
        },
        customers: {
          total: 200,
        },
      };
      analyticsRepository.getDashboardStats.mockResolvedValue(dashboardStats);

      const result = await service.getDashboard();

      expect(result).toHaveProperty('orders');
      expect(result).toHaveProperty('revenue');
      expect(result).toHaveProperty('products');
      expect(result).toHaveProperty('customers');
      expect(result.orders.total).toBe(100);
    });

    it('should handle empty data gracefully', async () => {
      const emptyStats: DashboardStats = {
        orders: {
          total: 0,
          pending: 0,
          confirmed: 0,
          delivered: 0,
          cancelled: 0,
        },
        revenue: {
          total: 0,
          today: 0,
          thisWeek: 0,
          thisMonth: 0,
        },
        products: {
          total: 0,
          visible: 0,
          outOfStock: 0,
        },
        customers: {
          total: 0,
        },
      };
      analyticsRepository.getDashboardStats.mockResolvedValue(emptyStats);

      const result = await service.getDashboard();

      expect(result.orders.total).toBe(0);
      expect(result.revenue.total).toBe(0);
      expect(result.products.total).toBe(0);
      expect(result.customers.total).toBe(0);
    });
  });

  describe('getOrderStats', () => {
    it('should return order statistics for the given period', async () => {
      const orderStats: OrderStats = {
        byStatus: {
          [OrderStatus.PENDING]: 10,
          [OrderStatus.CONFIRMED]: 20,
        },
        byDate: [
          { date: '2024-01-01', count: 5, total: 500 },
          { date: '2024-01-02', count: 8, total: 800 },
        ],
      };
      analyticsRepository.getOrderStats.mockResolvedValue(orderStats);

      const result = await service.getOrderStats(30);

      expect(result).toHaveProperty('byStatus');
      expect(result).toHaveProperty('byDate');
      expect(result.byStatus[OrderStatus.PENDING]).toBe(10);
      expect(result.byDate).toHaveLength(2);
    });

    it('should use default 30 days period', async () => {
      analyticsRepository.getOrderStats.mockResolvedValue({
        byStatus: {},
        byDate: [],
      });

      await service.getOrderStats();

      expect(analyticsRepository.getOrderStats).toHaveBeenCalledWith(30);
    });
  });

  describe('getTopProducts', () => {
    it('should return top selling products', async () => {
      const topProducts: TopProduct[] = [
        {
          productId: 'prod-1',
          productName: 'Product 1',
          productSku: 'SKU-001',
          totalQuantity: 100,
          totalRevenue: 10000,
        },
        {
          productId: 'prod-2',
          productName: 'Product 2',
          productSku: 'SKU-002',
          totalQuantity: 80,
          totalRevenue: 8000,
        },
      ];
      analyticsRepository.getTopProducts.mockResolvedValue(topProducts);

      const result = await service.getTopProducts(10);

      expect(result).toHaveLength(2);
      expect(result[0].totalQuantity).toBe(100);
      expect(result[0].totalRevenue).toBe(10000);
    });

    it('should return empty array when no products sold', async () => {
      analyticsRepository.getTopProducts.mockResolvedValue([]);

      const result = await service.getTopProducts();

      expect(result).toEqual([]);
    });
  });
});
