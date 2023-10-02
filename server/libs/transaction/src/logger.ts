import { Logger } from '@nestjs/common';
import { TransactionAls } from './als/transaction.als';

function txPrefix() {
  const tx = TransactionAls.getStore();
  if (tx) {
    const absId = tx.parent ? `${tx.parent}.${tx.id}` : tx.id;
    return `[${absId}]`;
  } else {
    return '';
  }
}

export const logger = new Proxy(new Logger('Transaction'), {
  get: function (target, p) {
    if (['log', 'error', 'warn', 'debug', 'verbose'].includes(p.toString())) {
      return (...args: any[]) => {
        if (typeof args[0] === 'string') {
          const prefix = txPrefix();
          if (prefix) {
            args[0] = `${prefix} ${args[0]}`;
          }

          return target[p].bind(target)(...args);
        } else {
          return target[p].bind(target)(...args);
        }
      };
    }
  },
});
