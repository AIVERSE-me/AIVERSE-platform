import { TransactionContext } from 'src/common/transcation-context';
import { Bill } from '../entity/bill.entity';

export const POINTS_PURCHASED_EVENT = 'aiverse.points-purchased';
export interface PointsPurchasedEventData {
  bill: Bill;
  ctx: TransactionContext;
}
