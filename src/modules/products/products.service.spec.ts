/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';

describe('ProductsService', () => {
  let service: ProductsService;
  let repository: any;

  const mockProduct: Product = {
    id: 'product-uuid',
    sku: 'SKU-001',
    name: 'Test Product',
    description: 'Test description',
    price: 100,
    salePrice: 80,
    imageUrl: 'http://example.com/image.jpg',
    categoryId: 'category-uuid',
    category: null as any,
    stockQuantity: 10,
    trackInventory: true,
    isVisible: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null as any,
    get effectivePrice() {
      return this.salePrice && this.salePrice > 0 ? this.salePrice : this.price;
    },
    get isInStock() {
      if (!this.trackInventory) return true;
      return this.stockQuantity > 0;
    },
  };

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    withDeleted: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    getOne: jest.fn(),
  };

  beforeEach(async () => {
    const mockRepository = {
      createQueryBuilder: jest.fn(() => mockQueryBuilder),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      softRemove: jest.fn(),
      restore: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product), useValue: mockRepository },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    repository = module.get(getRepositoryToken(Product));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllPublic', () => {
    it('should return paginated visible products', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockProduct], 1]);

      const result = await service.findAllPublic({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'product.isVisible = :isVisible',
        { isVisible: true },
      );
    });

    it('should filter by categoryId', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAllPublic({ page: 1, limit: 10, categoryId: 'cat-1' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'product.categoryId = :categoryId',
        { categoryId: 'cat-1' },
      );
    });

    it('should filter by search term', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAllPublic({ page: 1, limit: 10, search: 'test' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(product.name ILIKE :search OR product.description ILIKE :search OR product.sku ILIKE :search)',
        { search: '%test%' },
      );
    });
  });

  describe('findById', () => {
    it('should return a product when found', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockProduct);

      const result = await service.findById('product-uuid');

      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException when product not found', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.findById('unknown-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByIdPublic', () => {
    it('should return a visible product', async () => {
      repository.findOne.mockResolvedValue(mockProduct);

      const result = await service.findByIdPublic('product-uuid');

      expect(result).toEqual(mockProduct);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'product-uuid', isVisible: true, isActive: true },
        relations: ['category'],
      });
    });

    it('should throw NotFoundException when product not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findByIdPublic('unknown-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a new product', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(mockProduct);
      repository.save.mockResolvedValue(mockProduct);

      const createDto = {
        sku: 'SKU-001',
        name: 'Test Product',
        price: 100,
      };

      const result = await service.create(createDto);

      expect(result).toEqual(mockProduct);
      expect(repository.create).toHaveBeenCalledWith(createDto);
    });

    it('should throw ConflictException when SKU already exists', async () => {
      repository.findOne.mockResolvedValue(mockProduct);

      await expect(
        service.create({ sku: 'SKU-001', name: 'Product', price: 100 }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockProduct);
      repository.save.mockResolvedValue({ ...mockProduct, name: 'Updated' });

      const result = await service.update('product-uuid', { name: 'Updated' });

      expect(result.name).toBe('Updated');
    });
  });

  describe('delete', () => {
    it('should soft delete a product', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockProduct);
      repository.softRemove.mockResolvedValue(mockProduct);

      await service.delete('product-uuid');

      expect(repository.softRemove).toHaveBeenCalledWith(mockProduct);
    });
  });

  describe('restore', () => {
    it('should restore a deleted product', async () => {
      const deletedProduct = { ...mockProduct, deletedAt: new Date() };
      mockQueryBuilder.getOne.mockResolvedValueOnce(deletedProduct);
      mockQueryBuilder.getOne.mockResolvedValueOnce(mockProduct);
      repository.restore.mockResolvedValue({ affected: 1 });

      const result = await service.restore('product-uuid');

      expect(repository.restore).toHaveBeenCalledWith('product-uuid');
      expect(result).toEqual(mockProduct);
    });

    it('should throw ConflictException when product is not deleted', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockProduct);

      await expect(service.restore('product-uuid')).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
