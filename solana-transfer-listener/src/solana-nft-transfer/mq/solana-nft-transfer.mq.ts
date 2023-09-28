export const TRANSFER_CHANNEL_QUEUE = 'aiverse:transfer:channel';
export type TransferChannelJobData = SolanaTransferJobData;

interface SolanaTransferJobData {
  channel: 'solana';
  type: 'transfer';
  transferload: {
    from: string;
    to: string;
    tokenId: string;
    txHash: string;
    type: string;
    offlineId: string;
  };
}
