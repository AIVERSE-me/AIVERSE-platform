import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AiProductOutput } from './ai-product-output.entity';
import { GenerateParamsDTO } from '../../presets/dto/generate-params.dto';

@Entity()
export class AiProductOutputDetails {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'json' })
  params: GenerateParamsDTO;

  @Column({ type: 'json' })
  customParams: Partial<GenerateParamsDTO>;

  @Column({ type: 'json' })
  result: any;

  @OneToOne(() => AiProductOutput, { onDelete: 'CASCADE' })
  @JoinColumn()
  output: AiProductOutput;

  @CreateDateColumn()
  createTime: Date;

  @UpdateDateColumn()
  updateTime: Date;
}
