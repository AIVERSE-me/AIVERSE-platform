import { SolanaPurchasedJobData } from '../solana-purchasa/dto/solana-purchase-job-data.dto';
import { WechatPurchasedJobData } from '../wechat-pay/dto/wechat-purchase-job-data.dto';

/**
 * 购买渠道与BillModule的通讯队列
 */
export const PURCHASE_CHANNEL_QUEUE = 'aigc:pruchase:channel';

export type ChannelPurchasedJobData =
  | WechatPurchasedJobData
  | SolanaPurchasedJobData;
