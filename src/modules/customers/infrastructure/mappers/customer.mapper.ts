import { CustomerModel } from '../../domain/models/customer.model';
import { Customer } from '../entities/customer.entity';

export class CustomerMapper {
  static toDomain(entity: Customer): CustomerModel {
    const model = new CustomerModel();
    model.id = entity.id;
    model.name = entity.name;
    model.phone = entity.phone;
    model.address = entity.address;
    model.notes = entity.notes;
    model.orders = entity.orders ?? [];
    model.createdAt = entity.createdAt;
    model.updatedAt = entity.updatedAt;
    return model;
  }

  static toEntity(model: Partial<CustomerModel>): Partial<Customer> {
    const entity: Partial<Customer> = {};
    if (model.id !== undefined) entity.id = model.id;
    if (model.name !== undefined) entity.name = model.name;
    if (model.phone !== undefined) entity.phone = model.phone;
    if (model.address !== undefined) entity.address = model.address;
    if (model.notes !== undefined) entity.notes = model.notes;
    return entity;
  }
}
