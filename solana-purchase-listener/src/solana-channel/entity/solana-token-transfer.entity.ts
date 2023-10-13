import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
  } from 'typeorm';
  
  @Entity()
  export class SolanaTokenTransfer {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Index()
    @Column({ length: 256 })
    tx: string;
  
    // @Index()
    // @Column({ length: 256 })
    // asset: string;
  
    @Index()
    @Column({ length: 256 })
    from: string;
  
    @Index()
    @Column({ length: 256 })
    to: string;
  
    // @Column({ type: 'int' })
    // transferNotifyIndex: number;
  
    @Index()
    @Column({ type: 'int' })
    blockIndex: number;
  
    @Column({ length: 128 })
    amount: string;
  
    @Column({ type: 'int' })
    timestamp: number;
  
    @CreateDateColumn()
    createTime: Date;
  
    @UpdateDateColumn()
    updateTime: Date;
  }
  