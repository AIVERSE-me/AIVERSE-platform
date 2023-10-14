import { PriceLevel } from '../dto/price-level.dto';
import { PurchaseChannelId } from '../enum/PurchaseChannelId.enum';

export interface PurchaseChannel<Info, PurchasedJobData> {
  id(): PurchaseChannelId;
  /**
   * 
   */
  queryPointsPrice(): Promise<PriceLevel[]>;
  /**
   * 
   */
  isEnabled(): Promise<boolean>;
  /**
   * 
   */
  getChannelInfo(): Promise<Info>;
  /**
   * 
   */
  judgeUid(data: PurchasedJobData): Promise<string>;

  /**
   * 
   */
  convertUnit(data: PurchasedJobData): Promise<number>;
}
