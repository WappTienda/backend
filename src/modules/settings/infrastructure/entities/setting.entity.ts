import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('settings')
export class Setting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  key: string;

  @Column({ type: 'text', nullable: true })
  value: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: false })
  isPublic: boolean;

  @UpdateDateColumn()
  updatedAt: Date;
}
