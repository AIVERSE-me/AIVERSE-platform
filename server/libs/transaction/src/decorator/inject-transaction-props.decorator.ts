import { TransactionAls } from '../als/transaction.als';

import { Repository } from 'typeorm';
import { logger } from '../logger';

const PROXYED_PROP = '___proxyed___';
function createProxy(target: object) {
  return new Proxy(target, {
    get: function (target, p) {
      if (p === PROXYED_PROP) {
        return true;
      }

      if (target[p] instanceof Repository) {
        const tx = TransactionAls.getStore();
        if (!tx) {
          // not in store return origin
          return target[p];
        } else {
          const targetName = target.constructor.name;
          logger.verbose(`(USE TX REPO) ${targetName}.${p.toString()}`);
          return tx.queryRunner.manager.getRepository(target[p].target);
        }
      }

      return target[p];
    },
  });
}

// replace all repo in class
export function InjectTransactionProps<
  T extends { new (...args: any[]): object },
>() {
  return (constr: T) => {
    const cls = class extends constr {
      constructor(...args: any[]) {
        super(...args);
        logger.verbose(`wrap '${constr.name}' with TransactionContext`);
        return createProxy(this);
      }
    };

    // set constructor name
    Object.defineProperty(cls, 'name', {
      value: constr.name,
    });
    return cls as any;
  };
}

// const Deco: ClassDecorator = (value, context) => {};
