import { Repository } from 'typeorm';
import { DataSourceAls } from './als/datasource.als';
import { TransactionAls } from './als/transaction.als';
import { Logger } from '@nestjs/common';

export function filterRepositoryProperties(object: object) {
  const map: Record<string, Repository<any>> = {};
  for (const key of Object.keys(object)) {
    if (object[key] instanceof Repository) {
      map[key] = object[key];
    }
  }
  return map;
}

export function getDataSourceFromAls() {
  const store = DataSourceAls.getStore();
  return store?.datasource;
}

export function getCurrentTxFromAls() {
  return TransactionAls.getStore();
}

export function generateTxId() {
  return Math.random().toString(36).slice(2, 6);
}

type Callback = (...args: any[]) => any;
type HookName =
  | 'beforeCommit'
  | 'afterCommit'
  | 'beforeRollback'
  | 'afterRollback'
  | 'onComplete';
export class TransactionHooksManager {
  private readonly logger = new Logger(TransactionHooksManager.name);
  private readonly hooks: Record<string, Callback[]> = {};

  addHook(name: HookName, hook: Callback) {
    if (!this.hooks[name]) {
      this.hooks[name] = [];
    }
    this.hooks[name].push(hook);
  }

  async runHook(name: HookName, ...args: any[]) {
    const hooks = this.hooks[name];
    if (!hooks) {
      return;
    }
    for (const hook of hooks) {
      try {
        await hook(...args);
      } catch (err) {
        this.logger.error(`run hook failed.`, err);
      }
    }
  }
}

export const TransactionHooks = {
  addHook(name: HookName, hook: Callback) {
    const tx = getCurrentTxFromAls();
    if (!tx) {
      throw new Error(
        'TransactionHooks.addHook() must be called in transaction',
      );
    }
    tx.hooks.addHook(name, hook);
  },
  beforeCommit(func: Callback) {
    return this.addHook('beforeCommit', func);
  },
  afterCommit(func: Callback) {
    return this.addHook('afterCommit', func);
  },
  beforeRollback(func: Callback) {
    return this.addHook('beforeRollback', func);
  },
  afterRollback(func: Callback) {
    return this.addHook('afterRollback', func);
  },
  onComplete(func: Callback) {
    return this.addHook('onComplete', func);
  },
};
