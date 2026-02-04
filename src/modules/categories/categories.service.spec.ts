/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let repository: jest.Mocked<Repository<Category>>;

  const mockCategory: Category = {
    id: 'category-uuid',
    name: 'Electronics',
    slug: 'electronics',
    description: 'Electronic devices',
    order: 1,
    isActive: true,
    products: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: getRepositoryToken(Category), useValue: mockRepository },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    repository = module.get(getRepositoryToken(Category));
  });

  describe('findAll', () => {
    it('should return all categories', async () => {
      repository.find.mockResolvedValue([mockCategory]);

      const result = await service.findAll();

      expect(result).toEqual([mockCategory]);
      expect(repository.find).toHaveBeenCalledWith({
        where: {},
        order: { order: 'ASC', name: 'ASC' },
      });
    });

    it('should return only active categories when onlyActive is true', async () => {
      repository.find.mockResolvedValue([mockCategory]);

      await service.findAll(true);

      expect(repository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { order: 'ASC', name: 'ASC' },
      });
    });
  });

  describe('findById', () => {
    it('should return a category when found', async () => {
      repository.findOne.mockResolvedValue(mockCategory);

      const result = await service.findById('category-uuid');

      expect(result).toEqual(mockCategory);
    });

    it('should throw NotFoundException when category not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findById('unknown-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a new category', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(mockCategory);
      repository.save.mockResolvedValue(mockCategory);

      const result = await service.create({ name: 'Electronics' });

      expect(result).toEqual(mockCategory);
    });

    it('should throw ConflictException when name already exists', async () => {
      repository.findOne.mockResolvedValue(mockCategory);

      await expect(service.create({ name: 'Electronics' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('should generate slug from name', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(mockCategory);
      repository.save.mockResolvedValue(mockCategory);

      await service.create({ name: 'Test Category' });

      expect(repository.create).toHaveBeenCalledWith({
        name: 'Test Category',
        slug: 'test-category',
      });
    });
  });

  describe('update', () => {
    it('should update a category', async () => {
      repository.findOne
        .mockResolvedValueOnce(mockCategory)
        .mockResolvedValueOnce(null);
      repository.save.mockResolvedValue({
        ...mockCategory,
        name: 'Updated Name',
      });

      const result = await service.update('category-uuid', {
        name: 'Updated Name',
      });

      expect(result.name).toBe('Updated Name');
    });

    it('should throw ConflictException when name conflicts with another category', async () => {
      const otherCategory = { ...mockCategory, id: 'other-uuid' };
      repository.findOne
        .mockResolvedValueOnce(mockCategory)
        .mockResolvedValueOnce(otherCategory);

      await expect(
        service.update('category-uuid', { name: 'Existing Name' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('delete', () => {
    it('should delete a category', async () => {
      repository.findOne.mockResolvedValue(mockCategory);
      repository.remove.mockResolvedValue(mockCategory);

      await service.delete('category-uuid');

      expect(repository.remove).toHaveBeenCalledWith(mockCategory);
    });

    it('should throw NotFoundException when category not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.delete('unknown-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
