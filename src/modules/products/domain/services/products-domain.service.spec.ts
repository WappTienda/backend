/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */

import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ProductsService } from './products-domain.service';
import { ProductModel } from '../models/product.model';
import {
  PRODUCT_REPOSITORY,
  ProductRepositoryPort,
} from '../ports/out/product-repository.port';
import { CategoriesService } from '../../../categories/domain/services/categories-domain.service';
import { InventoryService } from '../../../inventory/domain/services/inventory-domain.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let productRepository: jest.Mocked<ProductRepositoryPort>;
  let categoriesService: any;
  let inventoryService: jest.Mocked<
    Pick<InventoryService, 'initializeForProduct' | 'syncStockForProduct'>
  >;

  const mockCategory = {
    id: 'category-uuid',
    name: 'Test Category',
    slug: 'test-category',
    isActive: true,
  };

  const mockProduct: ProductModel = Object.assign(new ProductModel(), {
    id: 'product-uuid',
    sku: 'SKU-001',
    name: 'Test Product',
    description: 'Test description',
    price: 100,
    salePrice: 80,
    imageUrl: 'http://example.com/image.jpg',
    categoryId: 'category-uuid',
    category: null as any,
    trackInventory: true,
    isVisible: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null as any,
  });

  const mockProductRepository: jest.Mocked<ProductRepositoryPort> = {
    findAllPublic: jest.fn(),
    findAllAdmin: jest.fn(),
    findById: jest.fn(),
    findByIdPublic: jest.fn(),
    findBySku: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    softRemove: jest.fn(),
    restore: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const mockCategoriesService = {
      findById: jest.fn(),
    };

    const mockInventoryService = {
      initializeForProduct: jest.fn().mockResolvedValue({}),
      syncStockForProduct: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PRODUCT_REPOSITORY, useValue: mockProductRepository },
        { provide: CategoriesService, useValue: mockCategoriesService },
        { provide: InventoryService, useValue: mockInventoryService },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    productRepository = module.get(PRODUCT_REPOSITORY);
    categoriesService = module.get<CategoriesService>(CategoriesService);
    inventoryService = module.get(InventoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllPublic', () => {
    it('should return paginated visible products', async () => {
      productRepository.findAllPublic.mockResolvedValue({
        data: [mockProduct],
        total: 1,
      });

      const result = await service.findAllPublic({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(productRepository.findAllPublic).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      });
    });

    it('should filter by categoryId', async () => {
      productRepository.findAllPublic.mockResolvedValue({
        data: [],
        total: 0,
      });

      await service.findAllPublic({ page: 1, limit: 10, categoryId: 'cat-1' });

      expect(productRepository.findAllPublic).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        categoryId: 'cat-1',
      });
    });

    it('should filter by search term', async () => {
      productRepository.findAllPublic.mockResolvedValue({
        data: [],
        total: 0,
      });

      await service.findAllPublic({ page: 1, limit: 10, search: 'test' });

      expect(productRepository.findAllPublic).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: 'test',
      });
    });
  });

  describe('findById', () => {
    it('should return a product when found', async () => {
      productRepository.findById.mockResolvedValue(mockProduct);

      const result = await service.findById('product-uuid');

      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException when product not found', async () => {
      productRepository.findById.mockResolvedValue(null);

      await expect(service.findById('unknown-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByIdPublic', () => {
    it('should return a visible product', async () => {
      productRepository.findByIdPublic.mockResolvedValue(mockProduct);

      const result = await service.findByIdPublic('product-uuid');

      expect(result).toEqual(mockProduct);
      expect(productRepository.findByIdPublic).toHaveBeenCalledWith(
        'product-uuid',
      );
    });

    it('should throw NotFoundException when product not found', async () => {
      productRepository.findByIdPublic.mockResolvedValue(null);

      await expect(service.findByIdPublic('unknown-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a new product', async () => {
      productRepository.findBySku.mockResolvedValue(null);
      productRepository.create.mockResolvedValue({
        ...mockProduct,
        trackInventory: false,
      } as ProductModel);

      const createDto = {
        sku: 'SKU-001',
        name: 'Test Product',
        price: 100,
      };

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(productRepository.create).toHaveBeenCalledWith(createDto);
    });

    it('should initialize inventory when creating a product with trackInventory=true', async () => {
      productRepository.findBySku.mockResolvedValue(null);
      productRepository.create.mockResolvedValue(mockProduct);

      await service.create({
        sku: 'SKU-001',
        name: 'Test Product',
        price: 100,
        trackInventory: true,
        stockQuantity: 10,
      });

      expect(inventoryService.initializeForProduct).toHaveBeenCalledWith(
        mockProduct.id,
        10,
      );
    });

    it('should not initialize inventory when creating a product with trackInventory=false', async () => {
      productRepository.findBySku.mockResolvedValue(null);
      productRepository.create.mockResolvedValue({
        ...mockProduct,
        trackInventory: false,
      } as ProductModel);

      await service.create({
        sku: 'SKU-001',
        name: 'Test Product',
        price: 100,
        trackInventory: false,
      });

      expect(inventoryService.initializeForProduct).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when SKU already exists', async () => {
      productRepository.findBySku.mockResolvedValue(mockProduct);

      await expect(
        service.create({ sku: 'SKU-001', name: 'Product', price: 100 }),
      ).rejects.toThrow(ConflictException);
    });

    it('should validate category when categoryId is provided', async () => {
      productRepository.findBySku.mockResolvedValue(null);
      categoriesService.findById.mockResolvedValue(mockCategory);
      productRepository.create.mockResolvedValue(mockProduct);

      const createDto = {
        sku: 'SKU-002',
        name: 'Test Product',
        price: 100,
        categoryId: 'category-uuid',
      };

      await service.create(createDto);

      expect(categoriesService.findById).toHaveBeenCalledWith('category-uuid');
    });

    it('should throw NotFoundException when category does not exist', async () => {
      productRepository.findBySku.mockResolvedValue(null);
      categoriesService.findById.mockRejectedValue(
        new NotFoundException('Category with ID category-uuid not found'),
      );

      const createDto = {
        sku: 'SKU-002',
        name: 'Test Product',
        price: 100,
        categoryId: 'category-uuid',
      };

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when category is not active', async () => {
      productRepository.findBySku.mockResolvedValue(null);
      categoriesService.findById.mockResolvedValue({
        ...mockCategory,
        isActive: false,
      });

      const createDto = {
        sku: 'SKU-002',
        name: 'Test Product',
        price: 100,
        categoryId: 'category-uuid',
      };

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create product without categoryId validation when not provided', async () => {
      productRepository.findBySku.mockResolvedValue(null);
      productRepository.create.mockResolvedValue(mockProduct);

      const createDto = {
        sku: 'SKU-003',
        name: 'Test Product',
        price: 100,
      };

      await service.create(createDto);

      expect(categoriesService.findById).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when salePrice is greater than price', async () => {
      productRepository.findBySku.mockResolvedValue(null);

      const createDto = {
        sku: 'SKU-004',
        name: 'Test Product',
        price: 100,
        salePrice: 150,
      };

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Sale price cannot be greater than regular price',
      );
    });

    it('should throw BadRequestException when salePrice is negative', async () => {
      productRepository.findBySku.mockResolvedValue(null);

      const createDto = {
        sku: 'SKU-005',
        name: 'Test Product',
        price: 100,
        salePrice: -10,
      };

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Sale price cannot be negative',
      );
    });

    it('should create product with valid salePrice less than price', async () => {
      productRepository.findBySku.mockResolvedValue(null);
      productRepository.create.mockResolvedValue(mockProduct);

      const createDto = {
        sku: 'SKU-006',
        name: 'Test Product',
        price: 100,
        salePrice: 80,
      };

      const result = await service.create(createDto);

      expect(result).toEqual(mockProduct);
      expect(productRepository.create).toHaveBeenCalledWith(createDto);
    });

    it('should create product with salePrice equal to price', async () => {
      productRepository.findBySku.mockResolvedValue(null);
      productRepository.create.mockResolvedValue(mockProduct);

      const createDto = {
        sku: 'SKU-007',
        name: 'Test Product',
        price: 100,
        salePrice: 100,
      };

      const result = await service.create(createDto);

      expect(result).toEqual(mockProduct);
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      productRepository.findById.mockResolvedValue(mockProduct);
      productRepository.save.mockResolvedValue({
        ...mockProduct,
        name: 'Updated',
      } as ProductModel);

      const result = await service.update('product-uuid', { name: 'Updated' });

      expect(result.name).toBe('Updated');
    });

    it('should sync inventory when updating stockQuantity of a tracked product', async () => {
      productRepository.findById.mockResolvedValue(mockProduct);
      productRepository.save.mockResolvedValue({ ...mockProduct } as ProductModel);

      await service.update('product-uuid', { stockQuantity: 20 });

      expect(inventoryService.syncStockForProduct).toHaveBeenCalledWith(
        mockProduct.id,
        20,
      );
    });

    it('should initialize inventory when enabling trackInventory on a product', async () => {
      const nonTrackedProduct = Object.assign(new ProductModel(), {
        ...mockProduct,
        trackInventory: false,
      });
      productRepository.findById.mockResolvedValue(nonTrackedProduct);
      productRepository.save.mockResolvedValue({
        ...mockProduct,
        trackInventory: true,
      } as ProductModel);

      await service.update('product-uuid', {
        trackInventory: true,
        stockQuantity: 10,
      });

      expect(inventoryService.initializeForProduct).toHaveBeenCalledWith(
        mockProduct.id,
        10,
      );
    });

    it('should validate category when categoryId is being updated', async () => {
      productRepository.findById.mockResolvedValue(mockProduct);
      categoriesService.findById.mockResolvedValue(mockCategory);
      productRepository.save.mockResolvedValue(mockProduct);

      await service.update('product-uuid', { categoryId: 'new-category-uuid' });

      expect(categoriesService.findById).toHaveBeenCalledWith(
        'new-category-uuid',
      );
    });

    it('should throw BadRequestException when updating to inactive category', async () => {
      productRepository.findById.mockResolvedValue(mockProduct);
      categoriesService.findById.mockResolvedValue({
        ...mockCategory,
        isActive: false,
      });

      await expect(
        service.update('product-uuid', { categoryId: 'category-uuid' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when updating salePrice greater than price', async () => {
      productRepository.findById.mockResolvedValue(mockProduct);

      await expect(
        service.update('product-uuid', { salePrice: 150 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when updating salePrice to negative', async () => {
      productRepository.findById.mockResolvedValue(mockProduct);

      await expect(
        service.update('product-uuid', { salePrice: -10 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate pricing when updating price', async () => {
      productRepository.findById.mockResolvedValue(
        Object.assign(new ProductModel(), {
          ...mockProduct,
          price: 100,
          salePrice: 80,
        }),
      );

      await expect(
        service.update('product-uuid', { price: 50 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow valid price and salePrice update', async () => {
      productRepository.findById.mockResolvedValue(mockProduct);
      productRepository.save.mockResolvedValue(mockProduct);

      const result = await service.update('product-uuid', {
        price: 120,
        salePrice: 90,
      });

      expect(result).toEqual(mockProduct);
    });
  });

  describe('delete', () => {
    it('should soft delete a product', async () => {
      productRepository.findById.mockResolvedValue(mockProduct);
      productRepository.softRemove.mockResolvedValue(undefined);

      await service.delete('product-uuid');

      expect(productRepository.softRemove).toHaveBeenCalledWith(mockProduct);
    });
  });

  describe('restore', () => {
    it('should restore a deleted product', async () => {
      const deletedProduct = Object.assign(new ProductModel(), {
        ...mockProduct,
        deletedAt: new Date(),
      });
      productRepository.findById.mockResolvedValueOnce(deletedProduct);
      productRepository.restore.mockResolvedValue(undefined);
      productRepository.findById.mockResolvedValueOnce(mockProduct);

      const result = await service.restore('product-uuid');

      expect(productRepository.restore).toHaveBeenCalledWith('product-uuid');
      expect(result).toEqual(mockProduct);
    });

    it('should throw ConflictException when product is not deleted', async () => {
      productRepository.findById.mockResolvedValue(mockProduct);

      await expect(service.restore('product-uuid')).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
