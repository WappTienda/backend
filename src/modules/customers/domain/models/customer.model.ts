export class CustomerModel {
  id: string;
  name: string;
  phone: string;
  address: string;
  notes: string;
  isActive: boolean;
  orders: any[];
  createdAt: Date;
  updatedAt: Date;
}
