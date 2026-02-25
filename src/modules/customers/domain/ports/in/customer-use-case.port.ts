import { CustomerModel } from '../../models/customer.model';
import { PaginatedResponseDto, PaginationQueryDto } from '../../../../../common/dto';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
} from '../../../application/dto';

export const CUSTOMER_USE_CASE = Symbol('CUSTOMER_USE_CASE');

export interface CustomerUseCasePort {
  findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<CustomerModel>>;
  findById(id: string): Promise<CustomerModel>;
  findByPhone(phone: string): Promise<CustomerModel | null>;
  create(dto: CreateCustomerDto): Promise<CustomerModel>;
  findOrCreate(dto: CreateCustomerDto): Promise<CustomerModel>;
  update(id: string, dto: UpdateCustomerDto): Promise<CustomerModel>;
}
