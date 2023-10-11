import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FinetuneOutputParams } from '../dto/finetune-output-params.dto';
import { Finetune } from 'src/finetune/entity/finetune';
import { FinetuneJobStatus } from 'src/finetune/enum/finetune-job-status.enum';

@Entity()
// 使用finetune微调模型的文生图输出
export class FinetuneOutput {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ length: 128 })
  creator: string;

  @ManyToOne(() => Finetune, {
    onDelete: 'CASCADE',
  })
  usedFinetune: Finetune;

  @Index()
  @Column({ type: 'enum', enum: FinetuneJobStatus })
  status: FinetuneJobStatus;

  @Column({ default: 0 })
  progress: number;

  @Column({ length: 128 })
  asset: string;

  @Column({ default: 0 })
  costPoints: number;

  @Column({ type: 'json' })
  params: FinetuneOutputParams;

  // @Column({ type: 'json' })
  // runParams: FinetuneOutputRunParams;

  // @Column({ type: 'json', nullable: true })
  // rawResult: any;

  @Index()
  @CreateDateColumn()
  createTime: Date;

  @UpdateDateColumn()
  updateTime: Date;
}
