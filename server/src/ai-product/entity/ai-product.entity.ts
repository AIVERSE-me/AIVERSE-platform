import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AiProductOutput } from './ai-product-output.entity';

@Entity()
export class AiProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 128 })
  creator: string;

  @Column()
  width: number;

  @Column()
  height: number;

  @Column({ length: 64, comment: 'asset id' })
  oriImg: string;

  @Column({ length: 64, comment: 'asset id' })
  maskImg: string;

  @Column({ length: 64, comment: 'asset id.' })
  maskedOriImg: string;

  @Column({ default: false })
  deleted: boolean;

  @OneToMany(() => AiProductOutput, (output) => output.product)
  outputs: AiProductOutput[];

  @CreateDateColumn()
  createTime: Date;

  @UpdateDateColumn()
  updateTime: Date;
}
