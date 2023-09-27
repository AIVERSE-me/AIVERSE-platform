import { Logger } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

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
}