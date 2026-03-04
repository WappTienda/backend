/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CustomersService } from './customers-domain.service';
import { CustomerModel } from '../models/customer.model';
import {
  CUSTOMER_REPOSITORY,
  CustomerRepositoryPort,
} from '../ports/out/customer-repository.port';

describe('CustomersService', () => {
  let service: CustomersService;
  let customerRepository: jest.Mocked<CustomerRepositoryPort>;

  const mockCustomer: CustomerModel = Object.assign(new CustomerModel(), {
    id: 'customer-uuid',
    name: 'John Doe',
    phone: '+1234567890',
    address: '123 Main St',
    notes: 'Regular customer',
    orders: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const mockCustomerRepository: jest.Mocked<CustomerRepositoryPort> = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByPhone: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        { provide: CUSTOMER_REPOSITORY, useValue: mockCustomerRepository },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
    customerRepository = module.get(CUSTOMER_REPOSITORY);
  });

  describe('findAll', () => {
    it('should return paginated customers', async () => {
      customerRepository.findAll.mockResolvedValue({
        data: [mockCustomer],
        total: 1,
      });

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });

    it('should use default pagination values', async () => {
      customerRepository.findAll.mockResolvedValue({ data: [], total: 0 });

      await service.findAll({});

      expect(customerRepository.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      });
    });
  });

  describe('findById', () => {
    it('should return a customer with orders', async () => {
      customerRepository.findById.mockResolvedValue(mockCustomer);

      const result = await service.findById('customer-uuid');

      expect(result).toEqual(mockCustomer);
      expect(customerRepository.findById).toHaveBeenCalledWith('customer-uuid');
    });

    it('should throw NotFoundException when customer not found', async () => {
      customerRepository.findById.mockResolvedValue(null);

      await expect(service.findById('unknown-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByPhone', () => {
    it('should return a customer when found', async () => {
      customerRepository.findByPhone.mockResolvedValue(mockCustomer);

      const result = await service.findByPhone('+1234567890');

      expect(result).toEqual(mockCustomer);
    });

    it('should return null when customer not found', async () => {
      customerRepository.findByPhone.mockResolvedValue(null);

      const result = await service.findByPhone('+0000000000');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new customer', async () => {
      customerRepository.create.mockResolvedValue(mockCustomer);

      const result = await service.create({
        name: 'John Doe',
        phone: '+1234567890',
      });

      expect(result).toEqual(mockCustomer);
    });
  });

  describe('findOrCreate', () => {
    it('should return existing customer and update details', async () => {
      customerRepository.findByPhone.mockResolvedValue(mockCustomer);
      customerRepository.save.mockResolvedValue({
        ...mockCustomer,
        name: 'Jane Doe',
        address: 'New Address',
      } as CustomerModel);

      const result = await service.findOrCreate({
        name: 'Jane Doe',
        phone: '+1234567890',
        address: 'New Address',
      });

      expect(result.name).toBe('Jane Doe');
      expect(customerRepository.save).toHaveBeenCalled();
    });

    it('should create new customer when not found', async () => {
      customerRepository.findByPhone.mockResolvedValue(null);
      customerRepository.create.mockResolvedValue(mockCustomer);

      const result = await service.findOrCreate({
        name: 'New Customer',
        phone: '+9876543210',
      });

      expect(result).toEqual(mockCustomer);
      expect(customerRepository.create).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a customer', async () => {
      customerRepository.findById.mockResolvedValue(mockCustomer);
      customerRepository.save.mockResolvedValue({
        ...mockCustomer,
        name: 'Updated',
      } as CustomerModel);

      const result = await service.update('customer-uuid', { name: 'Updated' });

      expect(result.name).toBe('Updated');
    });

    it('should throw NotFoundException when customer not found', async () => {
      customerRepository.findById.mockResolvedValue(null);

      await expect(
        service.update('unknown-uuid', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should soft-delete a customer', async () => {
      customerRepository.findById.mockResolvedValue(mockCustomer);
      customerRepository.delete.mockResolvedValue(undefined);

      await service.delete('customer-uuid');

      expect(customerRepository.findById).toHaveBeenCalledWith('customer-uuid');
      expect(customerRepository.delete).toHaveBeenCalledWith('customer-uuid');
    });

    it('should throw NotFoundException when customer not found', async () => {
      customerRepository.findById.mockResolvedValue(null);

      await expect(service.delete('unknown-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
