import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
  } from 'typeorm';
  
  @Entity()
  export class SolanaNftTransfer {
    @PrimaryGeneratedColumn('uuid')
    id: number;
  
    @Index()
    @Column({ type: 'int' })
    index: number;
  
    @Index()
    @Column({ length: 256 })
    blockHash: string;
  
    @Index()
    @Column({ length: 256 })
    txHash: string;

    @Index()
    @Column({ length: 256 })
    uri: string;

    @Index()
    @Column({ length: 256 })
    address: string;
  
    @Index()
    @Column({ length: 256 })
    time: string;
  
    @Index()
    @Column({ length: 256 })
    newOwner: string;
  
    @Index()
    @Column({ length: 256 })
    oldOwner: string;
  
    @Index()
    @Column({ length: 256 })
    nftTokenId: string;

    @Index()
    @Column({ type: 'int' })
    creatorNum: number;
  
    @CreateDateColumn()
    createTime: Date;
  
    @UpdateDateColumn()
    updateTime: Date;
  }
  