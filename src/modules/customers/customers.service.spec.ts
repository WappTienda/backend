/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CustomersService } from './customers.service';
import { Customer } from './entities/customer.entity';

describe('CustomersService', () => {
  let service: CustomersService;
  let repository: jest.Mocked<Repository<Customer>>;

  const mockCustomer: Customer = {
    id: 'customer-uuid',
    name: 'John Doe',
    phone: '+1234567890',
    address: '123 Main St',
    notes: 'Regular customer',
    orders: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockRepository = {
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        { provide: getRepositoryToken(Customer), useValue: mockRepository },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
    repository = module.get(getRepositoryToken(Customer));
  });

  describe('findAll', () => {
    it('should return paginated customers', async () => {
      repository.findAndCount.mockResolvedValue([[mockCustomer], 1]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });

    it('should use default pagination values', async () => {
      repository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({});

      expect(repository.findAndCount).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });
    });
  });

  describe('findById', () => {
    it('should return a customer with orders', async () => {
      repository.findOne.mockResolvedValue(mockCustomer);

      const result = await service.findById('customer-uuid');

      expect(result).toEqual(mockCustomer);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'customer-uuid' },
        relations: ['orders'],
      });
    });

    it('should throw NotFoundException when customer not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findById('unknown-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByPhone', () => {
    it('should return a customer when found', async () => {
      repository.findOne.mockResolvedValue(mockCustomer);

      const result = await service.findByPhone('+1234567890');

      expect(result).toEqual(mockCustomer);
    });

    it('should return null when customer not found', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findByPhone('+0000000000');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new customer', async () => {
      repository.create.mockReturnValue(mockCustomer);
      repository.save.mockResolvedValue(mockCustomer);

      const result = await service.create({
        name: 'John Doe',
        phone: '+1234567890',
      });

      expect(result).toEqual(mockCustomer);
    });
  });

  describe('findOrCreate', () => {
    it('should return existing customer and update details', async () => {
      repository.findOne.mockResolvedValue(mockCustomer);
      repository.save.mockResolvedValue({
        ...mockCustomer,
        name: 'Jane Doe',
        address: 'New Address',
      });

      const result = await service.findOrCreate({
        name: 'Jane Doe',
        phone: '+1234567890',
        address: 'New Address',
      });

      expect(result.name).toBe('Jane Doe');
      expect(repository.save).toHaveBeenCalled();
    });

    it('should create new customer when not found', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(mockCustomer);
      repository.save.mockResolvedValue(mockCustomer);

      const result = await service.findOrCreate({
        name: 'New Customer',
        phone: '+9876543210',
      });

      expect(result).toEqual(mockCustomer);
      expect(repository.create).toHaveBeenCalled();
    });

    it('should use provided EntityManager when given', async () => {
      const mockManagerRepo = {
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockReturnValue(mockCustomer),
        save: jest.fn().mockResolvedValue(mockCustomer),
      };
      const mockManager = {
        getRepository: jest.fn().mockReturnValue(mockManagerRepo),
      } as any;

      const result = await service.findOrCreate(
        { name: 'New Customer', phone: '+9876543210' },
        mockManager,
      );

      expect(mockManager.getRepository).toHaveBeenCalled();
      expect(mockManagerRepo.findOne).toHaveBeenCalled();
      expect(result).toEqual(mockCustomer);
      // The injected repository should NOT have been used
      expect(repository.findOne).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a customer', async () => {
      repository.findOne.mockResolvedValue(mockCustomer);
      repository.save.mockResolvedValue({ ...mockCustomer, name: 'Updated' });

      const result = await service.update('customer-uuid', { name: 'Updated' });

      expect(result.name).toBe('Updated');
    });

    it('should throw NotFoundException when customer not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update('unknown-uuid', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
