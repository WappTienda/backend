import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CustomerModel } from '../models/customer.model';
import {
  CUSTOMER_REPOSITORY,
  CustomerRepositoryPort,
} from '../ports/out/customer-repository.port';
import { CustomerUseCasePort } from '../ports/in/customer-use-case.port';
import { CreateCustomerDto, UpdateCustomerDto } from '../../application/dto';
import { PaginationQueryDto, PaginatedResponseDto } from '../../../../common/dto';

@Injectable()
export class CustomersService implements CustomerUseCasePort {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: CustomerRepositoryPort,
  ) {}

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<CustomerModel>> {
    const { page = 1, limit = 10 } = query;
    const { data, total } = await this.customerRepository.findAll({ page, limit });
    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findById(id: string): Promise<CustomerModel> {
    const customer = await this.customerRepository.findById(id);

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return customer;
  }

  async findByPhone(phone: string): Promise<CustomerModel | null> {
    return this.customerRepository.findByPhone(phone);
  }

  async create(dto: CreateCustomerDto): Promise<CustomerModel> {
    return this.customerRepository.create(dto);
  }

  async findOrCreate(dto: CreateCustomerDto): Promise<CustomerModel> {
    const existing = await this.findByPhone(dto.phone);
    if (existing) {
      // Update name/address if provided
      if (dto.name) existing.name = dto.name;
      if (dto.address) existing.address = dto.address;
      return this.customerRepository.save(existing);
    }
    return this.create(dto);
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<CustomerModel> {
    const customer = await this.findById(id);
    Object.assign(customer, dto);
    return this.customerRepository.save(customer);
  }
}
