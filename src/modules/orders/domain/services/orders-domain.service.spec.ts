/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders-domain.service';
import { OrderModel, OrderStatus } from '../models/order.model';
import {
  ORDER_REPOSITORY,
  OrderRepositoryPort,
} from '../ports/out/order-repository.port';
import { ProductsService } from '../../../products/domain/services/products-domain.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let orderRepository: jest.Mocked<OrderRepositoryPort>;
  let productsService: any;

  const mockCustomer = {
    id: 'customer-uuid',
    name: 'John Doe',
    phone: '+1234567890',
    address: '123 Main St',
  };

  const mockProduct = {
    id: 'product-uuid',
    name: 'Test Product',
    sku: 'SKU-001',
    price: 100,
    salePrice: 80,
    isInStock: true,
    trackInventory: true,
    stockQuantity: 10,
  };

  const mockOrder: OrderModel = Object.assign(new OrderModel(), {
    id: 'order-uuid',
    publicId: 'ABC123',
    customerId: 'customer-uuid',
    customer: mockCustomer as any,
    status: OrderStatus.PENDING,
    totalAmount: 80,
    customerNote: 'Please deliver in the morning',
    adminNote: null as any,
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const mockOrderRepository: jest.Mocked<OrderRepositoryPort> = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByPublicId: jest.fn(),
    create: jest.fn(),
    createPublicOrder: jest.fn(),
    releaseInventory: jest.fn(),
    cancelOrderAndReleaseInventory: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const mockProductsService = {
      findByIdPublic: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: ORDER_REPOSITORY, useValue: mockOrderRepository },
        { provide: ProductsService, useValue: mockProductsService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    orderRepository = module.get(ORDER_REPOSITORY);
    productsService = module.get(ProductsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated orders', async () => {
      mockOrderRepository.findAll.mockResolvedValue({
        data: [mockOrder],
        total: 1,
      });

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by status', async () => {
      mockOrderRepository.findAll.mockResolvedValue({ data: [], total: 0 });

      await service.findAll({
        page: 1,
        limit: 10,
        status: OrderStatus.PENDING,
      });

      expect(mockOrderRepository.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        status: OrderStatus.PENDING,
      });
    });

    it('should filter by search term', async () => {
      mockOrderRepository.findAll.mockResolvedValue({ data: [], total: 0 });

      await service.findAll({ page: 1, limit: 10, search: 'John' });

      expect(mockOrderRepository.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: 'John',
      });
    });
  });

  describe('findById', () => {
    it('should return an order with relations', async () => {
      orderRepository.findById.mockResolvedValue(mockOrder);

      const result = await service.findById('order-uuid');

      expect(result).toEqual(mockOrder);
      expect(orderRepository.findById).toHaveBeenCalledWith('order-uuid');
    });

    it('should throw NotFoundException when order not found', async () => {
      orderRepository.findById.mockResolvedValue(null);

      await expect(service.findById('unknown-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByPublicId', () => {
    it('should return an order by public ID', async () => {
      orderRepository.findByPublicId.mockResolvedValue(mockOrder);

      const result = await service.findByPublicId('ABC123');

      expect(result).toEqual(mockOrder);
    });

    it('should throw NotFoundException when order not found', async () => {
      orderRepository.findByPublicId.mockResolvedValue(null);

      await expect(service.findByPublicId('UNKNOWN')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createPublicOrder', () => {
    it('should create a new order', async () => {
      productsService.findByIdPublic.mockResolvedValue(mockProduct as any);
      orderRepository.createPublicOrder.mockResolvedValue(mockOrder);
      orderRepository.findById.mockResolvedValue(mockOrder);

      const result = await service.createPublicOrder({
        customerName: 'John Doe',
        customerPhone: '+1234567890',
        items: [{ productId: 'product-uuid', quantity: 1 }],
      });

      expect(result).toEqual(mockOrder);
      expect(productsService.findByIdPublic).toHaveBeenCalled();
      expect(orderRepository.createPublicOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          customerName: 'John Doe',
          customerPhone: '+1234567890',
          status: OrderStatus.PENDING,
          totalAmount: 80,
        }),
      );
    });

    it('should throw BadRequestException when product is out of stock', async () => {
      productsService.findByIdPublic.mockResolvedValue({
        ...mockProduct,
        isInStock: false,
      } as any);

      await expect(
        service.createPublicOrder({
          customerName: 'John Doe',
          customerPhone: '+1234567890',
          items: [{ productId: 'product-uuid', quantity: 1 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when quantity exceeds available stock', async () => {
      productsService.findByIdPublic.mockResolvedValue({
        ...mockProduct,
        trackInventory: true,
        stockQuantity: 2,
      } as any);

      await expect(
        service.createPublicOrder({
          customerName: 'John Doe',
          customerPhone: '+1234567890',
          items: [{ productId: 'product-uuid', quantity: 5 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create order for non-tracked inventory product when stockQuantity is zero', async () => {
      productsService.findByIdPublic.mockResolvedValue({
        ...mockProduct,
        trackInventory: false,
        stockQuantity: 0,
        isInStock: true,
      } as any);
      orderRepository.createPublicOrder.mockResolvedValue(mockOrder);
      orderRepository.findById.mockResolvedValue(mockOrder);

      const result = await service.createPublicOrder({
        customerName: 'John Doe',
        customerPhone: '+1234567890',
        items: [{ productId: 'product-uuid', quantity: 100 }],
      });

      expect(result).toEqual(mockOrder);
    });

    it('should roll back if repository throws during creation', async () => {
      productsService.findByIdPublic.mockResolvedValue(mockProduct as any);
      orderRepository.createPublicOrder.mockRejectedValue(
        new Error('DB error'),
      );

      await expect(
        service.createPublicOrder({
          customerName: 'John Doe',
          customerPhone: '+1234567890',
          items: [{ productId: 'product-uuid', quantity: 1 }],
        }),
      ).rejects.toThrow('DB error');

      expect(orderRepository.createPublicOrder).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('should update order status', async () => {
      orderRepository.findById.mockResolvedValue(mockOrder);
      orderRepository.save.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CONFIRMED,
      } as OrderModel);

      const result = await service.update('order-uuid', {
        status: OrderStatus.CONFIRMED,
      });

      expect(result.status).toBe(OrderStatus.CONFIRMED);
      expect(orderRepository.cancelOrderAndReleaseInventory).not.toHaveBeenCalled();
    });

    it('should call cancelOrderAndReleaseInventory when cancelling an order', async () => {
      orderRepository.findById.mockResolvedValue(mockOrder);
      orderRepository.cancelOrderAndReleaseInventory.mockResolvedValue(true);

      await service.update('order-uuid', { status: OrderStatus.CANCELLED });

      expect(orderRepository.cancelOrderAndReleaseInventory).toHaveBeenCalledWith(
        mockOrder.id,
      );
    });

    it('should also save additional fields when cancelling with adminNote', async () => {
      orderRepository.findById.mockResolvedValue(mockOrder);
      orderRepository.cancelOrderAndReleaseInventory.mockResolvedValue(true);
      orderRepository.save.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CANCELLED,
        adminNote: 'Cancelled by admin',
      } as OrderModel);

      await service.update('order-uuid', {
        status: OrderStatus.CANCELLED,
        adminNote: 'Cancelled by admin',
      });

      expect(orderRepository.cancelOrderAndReleaseInventory).toHaveBeenCalledWith(
        mockOrder.id,
      );
      expect(orderRepository.save).toHaveBeenCalled();
    });

    it('should not call cancelOrderAndReleaseInventory when transitioning to non-cancelled status', async () => {
      orderRepository.findById.mockResolvedValue(mockOrder);
      orderRepository.save.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CONFIRMED,
      } as OrderModel);

      await service.update('order-uuid', { status: OrderStatus.CONFIRMED });

      expect(orderRepository.cancelOrderAndReleaseInventory).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete an order', async () => {
      orderRepository.findById.mockResolvedValue(mockOrder);
      orderRepository.remove.mockResolvedValue(undefined);

      await service.delete('order-uuid');

      expect(orderRepository.remove).toHaveBeenCalledWith(mockOrder);
    });
  });

  describe('generateWhatsAppMessage', () => {
    it('should generate a WhatsApp message URL', () => {
      const orderWithItems = Object.assign(new OrderModel(), {
        ...mockOrder,
        items: [
          {
            quantity: 2,
            productName: 'Test Product',
            subtotal: 160,
          },
        ],
      });

      const result = service.generateWhatsAppMessage(
        orderWithItems,
        '+5491123456789',
      );

      expect(result).toContain('https://wa.me/5491123456789');
      expect(result).toContain(encodeURIComponent('Nuevo Pedido'));
    });
  });

  describe('getOrderSummary', () => {
    it('should return order summary object', () => {
      const orderWithItems = Object.assign(new OrderModel(), {
        ...mockOrder,
        status: OrderStatus.PENDING,
        items: [
          {
            productName: 'Test Product',
            productSku: 'SKU-001',
            quantity: 2,
            unitPrice: 80,
            subtotal: 160,
          },
        ],
      });

      const result = service.getOrderSummary(orderWithItems);

      expect(result).toHaveProperty('orderId', 'ABC123');
      expect(result).toHaveProperty('status', OrderStatus.PENDING);
      expect(result).toHaveProperty('items');
    });
  });
});
