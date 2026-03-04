import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Order } from '../../../orders/infrastructure/entities/order.entity';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Index()
  @Column()
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Order, (order) => order.customer)
  orders: Order[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
