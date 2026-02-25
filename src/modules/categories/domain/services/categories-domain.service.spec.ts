/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CategoriesService } from './categories-domain.service';
import {
  CATEGORY_REPOSITORY,
  CategoryRepositoryPort,
} from '../ports/out/category-repository.port';
import { CategoryModel } from '../models/category.model';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let repository: jest.Mocked<CategoryRepositoryPort>;

  const mockCategory: CategoryModel = {
    id: 'category-uuid',
    name: 'Electronics',
    slug: 'electronics',
    description: 'Electronic devices',
    order: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockRepository: jest.Mocked<CategoryRepositoryPort> = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      findBySlug: jest.fn(),
      findByNameOrSlug: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: CATEGORY_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    repository = module.get(CATEGORY_REPOSITORY);
  });

  describe('findAll', () => {
    it('should return all categories', async () => {
      repository.findAll.mockResolvedValue([mockCategory]);

      const result = await service.findAll();

      expect(result).toEqual([mockCategory]);
      expect(repository.findAll).toHaveBeenCalledWith(false);
    });

    it('should return only active categories when onlyActive is true', async () => {
      repository.findAll.mockResolvedValue([mockCategory]);

      await service.findAll(true);

      expect(repository.findAll).toHaveBeenCalledWith(true);
    });
  });

  describe('findById', () => {
    it('should return a category when found', async () => {
      repository.findById.mockResolvedValue(mockCategory);

      const result = await service.findById('category-uuid');

      expect(result).toEqual(mockCategory);
    });

    it('should throw NotFoundException when category not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById('unknown-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a new category', async () => {
      repository.findByNameOrSlug.mockResolvedValue(null);
      repository.create.mockResolvedValue(mockCategory);

      const result = await service.create({ name: 'Electronics' });

      expect(result).toEqual(mockCategory);
    });

    it('should throw ConflictException when name already exists', async () => {
      repository.findByNameOrSlug.mockResolvedValue(mockCategory);

      await expect(service.create({ name: 'Electronics' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('should generate slug from name', async () => {
      repository.findByNameOrSlug.mockResolvedValue(null);
      repository.create.mockResolvedValue(mockCategory);

      await service.create({ name: 'Test Category' });

      expect(repository.create).toHaveBeenCalledWith({
        name: 'Test Category',
        slug: 'test-category',
      });
    });
  });

  describe('update', () => {
    it('should update a category', async () => {
      repository.findById.mockResolvedValue(mockCategory);
      repository.findByName.mockResolvedValue(null);
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
      repository.findById.mockResolvedValue(mockCategory);
      repository.findByName.mockResolvedValue(otherCategory);

      await expect(
        service.update('category-uuid', { name: 'Existing Name' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('delete', () => {
    it('should delete a category', async () => {
      repository.findById.mockResolvedValue(mockCategory);
      repository.remove.mockResolvedValue(undefined);

      await service.delete('category-uuid');

      expect(repository.remove).toHaveBeenCalledWith(mockCategory);
    });

    it('should throw NotFoundException when category not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.delete('unknown-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
