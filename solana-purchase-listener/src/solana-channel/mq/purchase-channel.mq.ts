export const PURCHASE_CHANNEL_QUEUE = 'aigc:pruchase:channel';
export type PurchaseChannelJobData = SolanaPurchasedJobData;

interface SolanaPurchasedJobData {
  channel: 'solana';
  type: 'purchased';
  payload: {
    address: string;
    amount: string;
    orderId: string;
    txHash: string;
  };
}
