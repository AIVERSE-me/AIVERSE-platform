import { TransactionContext } from 'src/common/transcation-context';
import { Bill } from '../entity/bill.entity';

export interface IBillsService {
  queryBills: (
    args: {
      uid: string; 
      channels?: string[]; 
    },
    ctx?: TransactionContext,
  ) => Promise<Bill[]>;

  countTotalBoughtPoints: (
    args: {
      uid: string;
      channels?: string[]; 
    },
    ctx?: TransactionContext,
  ) => Promise<number>;

  queryPointsPrices: (
    channel: string,
  ) => Promise<{ price: number; points: number; tempPoints: number }[]>;

  canUseChannel: (channel: string) => Promise<boolean>;

  getChannelInfo: (channel: string) => any;
}
