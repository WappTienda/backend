export enum UserRole {
  ADMIN = 'admin',
}

export class UserModel {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
