import {
  Propagation,
  TransactionHooks,
  runInTransaction,
} from '@app/transaction';
import {
  getCurrentTxFromAls,
  getDataSourceFromAls,
} from '@app/transaction/utils';
import { Logger } from '@nestjs/common';
import { DataSource, EntityManager, EntityTarget, Repository } from 'typeorm';

/**
 * 封装TransactionContext, 通过函数参数传递．当参数不存在时，自动创建TransactionContext
 */

type Callback = () => Promise<any>;

export class TransactionContext {
  private afterCommitCallbacks: Callback[];
  private entityManager: EntityManager | null;
  private ended: boolean;

  private logger = new Logger(TransactionContext.name);

  constructor(private datasource: DataSource) {
    this.afterCommitCallbacks = [];
    this.entityManager = null;
    this.ended = false;
  }

  async run<T>(
    func: (entityManager: EntityManager, ctx: TransactionContext) => Promise<T>,
  ) {
    if (this.ended) {
      throw new Error('TransactionContext is ended');
    }
    // 判断是否在Tx中
    if (!this.entityManager) {
      let result: T;
      try {
        result = await this.datasource.transaction(async (entityManager) => {
          this.entityManager = entityManager;
          return await func(entityManager, this);
        });
      } catch (err) {
        this.ended = true;
        throw err;
      }

      this.ended = true;
      // do afterCommit
      await Promise.all(
        this.afterCommitCallbacks.map(async (cb) => {
          try {
            await cb();
          } catch (err) {
            this.logger.error('run commit callback failed', err);
          }
        }),
      );

      return result;
    } else {
      return await func(this.entityManager, this);
    }
  }

  runAfterCommit(cb: Callback) {
    if (this.ended) {
      throw new Error('TransactionContext is ended');
    }
    this.afterCommitCallbacks.push(cb);
  }

  getEntityManager(): EntityManager | null {
    return this.entityManager;
  }

  getRepository<T>(target: EntityTarget<T>): Repository<T> | null {
    return this.entityManager?.getRepository(target) || null;
  }
}

/**
 * 用于Transactional()场景调用TransactionContext风格的代码
 */
export class TransactionContextCompatible extends TransactionContext {
  constructor() {
    super(getDataSourceFromAls());
  }

  async run<T>(
    func: (entityManager: EntityManager, ctx: TransactionContext) => Promise<T>,
  ): Promise<T> {
    return await runInTransaction(
      {
        propagation: Propagation.REQUIRED,
      },
      async () => {
        const { queryRunner } = getCurrentTxFromAls();

        return await func(queryRunner.manager, this);
      },
    );
  }

  runAfterCommit(cb: Callback) {
    TransactionHooks.afterCommit(cb);
  }
  getEntityManager(): EntityManager | null {
    return getCurrentTxFromAls().queryRunner.manager;
  }
  getRepository<T>(target: EntityTarget<T>): Repository<T> | null {
    return this.getEntityManager()?.getRepository(target) || null;
  }
}
