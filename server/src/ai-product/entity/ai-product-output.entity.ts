import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AiProduct } from './ai-product.entity';
import { AiProductOutputStatus } from '../enum/ai-product-output-status.enum';

@Entity()
export class AiProductOutput {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ length: 128 })
  creator: string;

  @Column({ default: '' })
  asset: string;

  @ManyToOne(() => AiProduct, (p) => p.outputs, { onDelete: 'CASCADE' })
  product: AiProduct;

  @Column({
    type: 'enum',
    enum: AiProductOutputStatus,
    default: AiProductOutputStatus.CREATED,
  })
  status: AiProductOutputStatus;

  @Column({ default: 0 })
  progress: number;

  @Column({ type: 'text', nullable: true })
  error?: string;

  @Column({ default: false })
  deleted: boolean;

  @CreateDateColumn()
  createTime: Date;

  @UpdateDateColumn()
  updateTime: Date;
}
