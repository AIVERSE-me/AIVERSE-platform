import { DataSourceAls } from '../als/datasource.als';
import { TransactionAls, TransactionState } from '../als/transaction.als';
import { Isolation } from '../enum/isolation.enum';
import { Propagation } from '../enum/propagation.enum';
import { logger } from '../logger';
import { TransactionHooksManager, generateTxId } from '../utils';

export function Transactional(opts?: {
  propagation?: Propagation;
  isolation?: Isolation;
}): MethodDecorator {
  return function (
    target: object,
    methodName: string,
    descriptor: PropertyDescriptor,
  ) {
    const originMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return await runInTransaction.bind(this)(opts, originMethod, ...args);
    };
  };
}

export async function runInTransaction(
  options: {
    propagation?: Propagation;
    isolation?: Isolation;
  },
  originMethod: PropertyDescriptor['value'],
  ...args: any[]
) {
  const { propagation = Propagation.REQUIRED, isolation } = options || {};

  const datasource = DataSourceAls.getStore()?.datasource;
  if (!datasource) {
    throw new Error('@Transaction() must run in TransactionMiddleware');
  }

  const currTx = TransactionAls.getStore();

  const hasRunner = currTx && currTx.queryRunner;
  const hasActiveTx = hasRunner && currTx.queryRunner.isTransactionActive;

  const run = async (opts: {
    newRunner: boolean;
    newTx: boolean;
    useHooks?: TransactionHooksManager;
  }): Promise<any> => {
    const { newRunner, newTx, useHooks: propagatedHooks } = opts;

    const getParent = () => {
      if (currTx) {
        return [currTx.parent, currTx.id].filter((v) => !!v).join('.');
      }
      return '';
    };
    const tx: TransactionState = newRunner
      ? {
          id: generateTxId(),
          parent: getParent(),
          isolation,
          propagation,
          queryRunner: datasource.createQueryRunner(),
          hooks: propagatedHooks ?? new TransactionHooksManager(),
        }
      : {
          id: generateTxId(),
          parent: getParent(),
          isolation,
          propagation,
          queryRunner: currTx.queryRunner,
          hooks: propagatedHooks ?? new TransactionHooksManager(),
        };

    return await TransactionAls.run(tx, async () => {
      const executeWithReplacedRepos = async () => {
        const result = await originMethod.bind(this)(...args);
        return result;
      };

      logger.verbose(
        `transactional propagation='${propagation}' isolation='${
          isolation || 'datasource default'
        }'`,
      );

      if (newRunner) {
        logger.debug(`queryRunner.connect()`);
        await tx.queryRunner.connect();
      }

      if (newTx) {
        logger.debug(`queryRunner.startTransaction(${tx.isolation || ''})`);
        await tx.queryRunner.startTransaction(tx.isolation);
        try {
          const result = await executeWithReplacedRepos();
          logger.debug(`queryRunner.commitTransaction()`);

          if (!propagatedHooks) {
            logger.verbose(`runHook('beforeCommit')`);
            await tx.hooks.runHook('beforeCommit');
          }
          await tx.queryRunner.commitTransaction();
          if (!propagatedHooks) {
            logger.verbose(`runHook('afterCommit')`);
            await tx.hooks.runHook('afterCommit');
          }
          return result;
        } catch (err) {
          logger.debug(`queryRunner.rollbackTransaction()`);

          if (!propagatedHooks) {
            logger.verbose(`runHook('beforeRollback')`);
            await tx.hooks.runHook('beforeRollback');
          }
          await tx.queryRunner.rollbackTransaction();
          if (!propagatedHooks) {
            logger.verbose(`runHook('afterRollback')`);
            await tx.hooks.runHook('afterRollback');
          }
          throw err;
        } finally {
          logger.debug(`queryRunner.release()`);
          await tx.queryRunner.release();
          if (!propagatedHooks) {
            logger.verbose(`runHook('onComplete')`);
            await tx.hooks.runHook('onComplete');
          }
        }
      } else {
        return await executeWithReplacedRepos();
      }
    });
  };

  switch (propagation) {
    case Propagation.REQUIRED: {
      return await run({
        newRunner: !hasRunner,
        newTx: !hasActiveTx,
        useHooks: hasActiveTx ? currTx.hooks : undefined,
      });
    }
    case Propagation.SUPPORTS: {
      return await run({
        newRunner: !hasRunner,
        newTx: false,
        useHooks: currTx?.hooks,
      });
    }
    case Propagation.MANDATORY: {

      if (!hasActiveTx) {
        throw new Error('MANDATORY transaction required');
      }
      return await run({
        newRunner: false,
        newTx: false,
        useHooks: currTx?.hooks,
      });
    }
    case Propagation.REQUIRES_NEW: {
      return await run({
        newRunner: true,
        newTx: true,
        useHooks: undefined,
      });
    }

    case Propagation.NOT_SUPPORTED: {
      return await run({ newRunner: true, newTx: false });
    }

    case Propagation.NEVER: {

      if (hasActiveTx) {
        throw new Error('NEVER required no transaction');
      }
      return await run({ newRunner: !hasRunner, newTx: false });
    }

    case Propagation.NESTED: {

      return await run({
        newRunner: !hasRunner,
        newTx: true,
        useHooks: hasActiveTx ? currTx?.hooks : undefined,
      });
    }

    default:
      throw new Error(`unknown propagation: ${propagation}`);
  }
}
