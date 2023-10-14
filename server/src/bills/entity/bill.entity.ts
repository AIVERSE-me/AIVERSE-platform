import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Unique('uq_bill_channel_oid', ['channel', 'orderId']) // channel 中orderId唯一
@Entity()
export class Bill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ length: 128 })
  uid: string;

  @Index()
  @Column({ length: 128 })
  channel: string;

  @Column({ length: 128 })
  orderId: string;

  @Column({ type: 'int' })
  points: number;

  @Column({ length: 256 })
  reason: string;

  @Column({ type: 'json' })
  payload: any;

  @CreateDateColumn()
  createTime: Date;

  @UpdateDateColumn()
  updateTime: Date;
}
