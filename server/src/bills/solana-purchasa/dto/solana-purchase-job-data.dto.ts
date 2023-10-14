export interface SolanaPurchasedJobData {
  channel: 'solana';
  type: 'purchased';
  payload: {
    address: string;
    amount: string;
    orderId: string;
    txHash: string;
  };
}
