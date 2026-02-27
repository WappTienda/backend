import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../../entities/customer.entity';
import { CustomerMapper } from '../../mappers/customer.mapper';
import { CustomerModel } from '../../../domain/models/customer.model';
import {
  CustomerRepositoryPort,
  FindCustomersQuery,
  PaginatedCustomers,
} from '../../../domain/ports/out/customer-repository.port';

@Injectable()
export class TypeOrmCustomerRepository implements CustomerRepositoryPort {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async findAll(query: FindCustomersQuery): Promise<PaginatedCustomers> {
    const { page = 1, limit = 10 } = query;

    const [entities, total] = await this.customerRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: entities.map((entity) => CustomerMapper.toDomain(entity)),
      total,
    };
  }

  async findById(id: string): Promise<CustomerModel | null> {
    const entity = await this.customerRepository.findOne({
      where: { id },
      relations: ['orders'],
    });

    return entity ? CustomerMapper.toDomain(entity) : null;
  }

  async findByPhone(phone: string): Promise<CustomerModel | null> {
    const entity = await this.customerRepository.findOne({
      where: { phone },
    });

    return entity ? CustomerMapper.toDomain(entity) : null;
  }

  async create(data: Partial<CustomerModel>): Promise<CustomerModel> {
    const entityData = CustomerMapper.toEntity(data);
    const entity = this.customerRepository.create(entityData);
    const saved = await this.customerRepository.save(entity);
    return CustomerMapper.toDomain(saved);
  }

  async save(customer: CustomerModel): Promise<CustomerModel> {
    const entityData = CustomerMapper.toEntity(customer);
    const entity = this.customerRepository.create(entityData);
    const saved = await this.customerRepository.save(entity);
    return CustomerMapper.toDomain(saved);
  }
}
