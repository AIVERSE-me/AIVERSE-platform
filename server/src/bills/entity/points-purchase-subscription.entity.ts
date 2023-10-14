import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class PointsPurchaseSubscription {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ length: 128 })
  uid: string;

  @Column({ type: 'int' })
  lastBlockHeight: number;

  @CreateDateColumn()
  createTime: Date;

  @UpdateDateColumn()
  updateTime: Date;
}
