import { AsyncLocalStorage } from 'async_hooks';
import { Isolation } from '../enum/isolation.enum';
import { Propagation } from '../enum/propagation.enum';
import { QueryRunner } from 'typeorm';
import { TransactionHooksManager } from '../utils';

export type Hook = () => any;

export interface TransactionState {
  id: string;
  parent: string;
  isolation: Isolation;
  propagation: Propagation;
  queryRunner: QueryRunner;
  hooks: TransactionHooksManager;
}

export const TransactionAls = new AsyncLocalStorage<TransactionState>();
