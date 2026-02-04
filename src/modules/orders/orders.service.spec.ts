/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CustomersService } from '../customers/customers.service';
import { ProductsService } from '../products/products.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let orderRepository: any;
  let customersService: any;
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
  };

  const mockOrder: Order = {
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
    generatePublicId: jest.fn(),
    calculateTotal: jest.fn().mockReturnValue(80),
  };

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };

  beforeEach(async () => {
    const mockOrderRepository = {
      createQueryBuilder: jest.fn(() => mockQueryBuilder),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const mockOrderItemRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    const mockCustomersService = {
      findOrCreate: jest.fn(),
    };

    const mockProductsService = {
      findByIdPublic: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useValue: mockOrderRepository },
        {
          provide: getRepositoryToken(OrderItem),
          useValue: mockOrderItemRepository,
        },
        { provide: CustomersService, useValue: mockCustomersService },
        { provide: ProductsService, useValue: mockProductsService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    orderRepository = module.get(getRepositoryToken(Order));
    customersService = module.get(CustomersService);
    productsService = module.get(ProductsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated orders', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockOrder], 1]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by status', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({
        page: 1,
        limit: 10,
        status: OrderStatus.PENDING,
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'order.status = :status',
        { status: OrderStatus.PENDING },
      );
    });

    it('should filter by search term', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ page: 1, limit: 10, search: 'John' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(order.publicId ILIKE :search OR customer.name ILIKE :search OR customer.phone ILIKE :search)',
        { search: '%John%' },
      );
    });
  });

  describe('findById', () => {
    it('should return an order with relations', async () => {
      orderRepository.findOne.mockResolvedValue(mockOrder);

      const result = await service.findById('order-uuid');

      expect(result).toEqual(mockOrder);
      expect(orderRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'order-uuid' },
        relations: ['customer', 'items', 'items.product'],
      });
    });

    it('should throw NotFoundException when order not found', async () => {
      orderRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('unknown-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByPublicId', () => {
    it('should return an order by public ID', async () => {
      orderRepository.findOne.mockResolvedValue(mockOrder);

      const result = await service.findByPublicId('ABC123');

      expect(result).toEqual(mockOrder);
    });

    it('should throw NotFoundException when order not found', async () => {
      orderRepository.findOne.mockResolvedValue(null);

      await expect(service.findByPublicId('UNKNOWN')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createPublicOrder', () => {
    it('should create a new order', async () => {
      customersService.findOrCreate.mockResolvedValue(mockCustomer as any);
      productsService.findByIdPublic.mockResolvedValue(mockProduct as any);
      orderRepository.create.mockReturnValue(mockOrder);
      orderRepository.save.mockResolvedValue(mockOrder);
      orderRepository.findOne.mockResolvedValue(mockOrder);

      const result = await service.createPublicOrder({
        customerName: 'John Doe',
        customerPhone: '+1234567890',
        items: [{ productId: 'product-uuid', quantity: 1 }],
      });

      expect(result).toEqual(mockOrder);
      expect(customersService.findOrCreate).toHaveBeenCalled();
      expect(productsService.findByIdPublic).toHaveBeenCalled();
    });

    it('should throw BadRequestException when product is out of stock', async () => {
      customersService.findOrCreate.mockResolvedValue(mockCustomer as any);
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
  });

  describe('update', () => {
    it('should update order status', async () => {
      orderRepository.findOne.mockResolvedValue(mockOrder);
      orderRepository.save.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CONFIRMED,
      });

      const result = await service.update('order-uuid', {
        status: OrderStatus.CONFIRMED,
      });

      expect(result.status).toBe(OrderStatus.CONFIRMED);
    });
  });

  describe('delete', () => {
    it('should delete an order', async () => {
      orderRepository.findOne.mockResolvedValue(mockOrder);
      orderRepository.remove.mockResolvedValue(mockOrder);

      await service.delete('order-uuid');

      expect(orderRepository.remove).toHaveBeenCalledWith(mockOrder);
    });
  });

  describe('generateWhatsAppMessage', () => {
    it('should generate a WhatsApp message URL', () => {
      const orderWithItems = {
        ...mockOrder,
        items: [
          {
            quantity: 2,
            productName: 'Test Product',
            subtotal: 160,
          },
        ],
      } as Order;

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
      const orderWithItems = {
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
      } as Order;

      const result = service.getOrderSummary(orderWithItems);

      expect(result).toHaveProperty('orderId', 'ABC123');
      expect(result).toHaveProperty('status', OrderStatus.PENDING);
      expect(result).toHaveProperty('items');
    });
  });
});
