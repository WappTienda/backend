/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { InventoryService } from './inventory-domain.service';
import { InventoryModel } from '../models/inventory.model';
import {
  INVENTORY_REPOSITORY,
  InventoryRepositoryPort,
} from '../ports/out/inventory-repository.port';

describe('InventoryService', () => {
  let service: InventoryService;
  let inventoryRepository: jest.Mocked<InventoryRepositoryPort>;

  const mockInventory: InventoryModel = Object.assign(new InventoryModel(), {
    id: 'inventory-uuid',
    productId: 'product-uuid',
    stockQuantity: 50,
    reservedQuantity: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const mockInventoryRepository: jest.Mocked<InventoryRepositoryPort> = {
    findAll: jest.fn(),
    findByProductId: jest.fn(),
    upsertForProduct: jest.fn(),
    adjustStock: jest.fn(),
    syncStock: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: INVENTORY_REPOSITORY,
          useValue: mockInventoryRepository,
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    inventoryRepository = module.get(INVENTORY_REPOSITORY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated inventory records', async () => {
      inventoryRepository.findAll.mockResolvedValue({
        data: [mockInventory],
        total: 1,
      });

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(inventoryRepository.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      });
    });
  });

  describe('findByProductId', () => {
    it('should return inventory for a product', async () => {
      inventoryRepository.findByProductId.mockResolvedValue(mockInventory);

      const result = await service.findByProductId('product-uuid');

      expect(result).toEqual(mockInventory);
      expect(inventoryRepository.findByProductId).toHaveBeenCalledWith(
        'product-uuid',
      );
    });

    it('should throw NotFoundException when inventory not found', async () => {
      inventoryRepository.findByProductId.mockResolvedValue(null);

      await expect(service.findByProductId('unknown-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('adjustStock', () => {
    it('should adjust stock for a tracked product', async () => {
      inventoryRepository.findByProductId.mockResolvedValue(mockInventory);
      inventoryRepository.adjustStock.mockResolvedValue({
        ...mockInventory,
        stockQuantity: 60,
      } as InventoryModel);

      const result = await service.adjustStock('product-uuid', {
        quantity: 10,
      });

      expect(result.stockQuantity).toBe(60);
      expect(inventoryRepository.adjustStock).toHaveBeenCalledWith(
        'product-uuid',
        10,
      );
    });

    it('should throw NotFoundException when inventory not found', async () => {
      inventoryRepository.findByProductId.mockResolvedValue(null);

      await expect(
        service.adjustStock('unknown-uuid', { quantity: 5 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('initializeForProduct', () => {
    it('should initialize inventory for a product', async () => {
      inventoryRepository.upsertForProduct.mockResolvedValue(mockInventory);

      const result = await service.initializeForProduct('product-uuid', 50);

      expect(result).toEqual(mockInventory);
      expect(inventoryRepository.upsertForProduct).toHaveBeenCalledWith(
        'product-uuid',
        50,
      );
    });
  });

  describe('syncStockForProduct', () => {
    it('should sync stock quantity for a tracked product', async () => {
      inventoryRepository.findByProductId.mockResolvedValue(mockInventory);
      inventoryRepository.syncStock.mockResolvedValue({
        ...mockInventory,
        stockQuantity: 30,
      } as InventoryModel);

      const result = await service.syncStockForProduct('product-uuid', 30);

      expect(result.stockQuantity).toBe(30);
      expect(inventoryRepository.syncStock).toHaveBeenCalledWith(
        'product-uuid',
        30,
      );
    });

    it('should throw NotFoundException when inventory not found', async () => {
      inventoryRepository.findByProductId.mockResolvedValue(null);

      await expect(
        service.syncStockForProduct('unknown-uuid', 30),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('availableQuantity getter', () => {
    it('should compute availableQuantity correctly', () => {
      const inventory = Object.assign(new InventoryModel(), {
        stockQuantity: 50,
        reservedQuantity: 15,
      });

      expect(inventory.availableQuantity).toBe(35);
    });
  });
});
