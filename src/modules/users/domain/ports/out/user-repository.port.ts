import { UserModel } from '../../models/user.model';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface UserRepositoryPort {
  findByEmail(email: string): Promise<UserModel | null>;
  findById(id: string): Promise<UserModel | null>;
  create(userData: Partial<UserModel>): Promise<UserModel>;
}
