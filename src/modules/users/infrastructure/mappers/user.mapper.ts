import { UserModel } from '../../domain/models/user.model';
import { User } from '../entities/user.entity';

export class UserMapper {
  static toDomain(entity: User): UserModel {
    const model = new UserModel();
    model.id = entity.id;
    model.email = entity.email;
    model.password = entity.password;
    model.name = entity.name;
    model.role = entity.role;
    model.isActive = entity.isActive;
    model.createdAt = entity.createdAt;
    model.updatedAt = entity.updatedAt;
    return model;
  }

  static toEntity(model: Partial<UserModel>): Partial<User> {
    const entity: Partial<User> = {};
    if (model.id !== undefined) entity.id = model.id;
    if (model.email !== undefined) entity.email = model.email;
    if (model.password !== undefined) entity.password = model.password;
    if (model.name !== undefined) entity.name = model.name;
    if (model.role !== undefined) entity.role = model.role;
    if (model.isActive !== undefined) entity.isActive = model.isActive;
    return entity;
  }
}
