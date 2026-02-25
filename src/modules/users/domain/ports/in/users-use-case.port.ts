import { UserModel } from '../../models/user.model';

export const USERS_USE_CASE = Symbol('USERS_USE_CASE');

export interface UsersUseCasePort {
  findByEmail(email: string): Promise<UserModel | null>;
  findById(id: string): Promise<UserModel | null>;
  create(userData: Partial<UserModel>): Promise<UserModel>;
}
