import { CustomerModel } from '../../models/customer.model';

export interface PaginatedCustomers {
  data: CustomerModel[];
  total: number;
}

export interface FindCustomersQuery {
  page?: number;
  limit?: number;
}

export const CUSTOMER_REPOSITORY = Symbol('CUSTOMER_REPOSITORY');

export interface CustomerRepositoryPort {
  findAll(query: FindCustomersQuery): Promise<PaginatedCustomers>;
  findById(id: string): Promise<CustomerModel | null>;
  findByPhone(phone: string): Promise<CustomerModel | null>;
  create(data: Partial<CustomerModel>): Promise<CustomerModel>;
  save(customer: CustomerModel): Promise<CustomerModel>;
  delete(id: string): Promise<void>;
}
