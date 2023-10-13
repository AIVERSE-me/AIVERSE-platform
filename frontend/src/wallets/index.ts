import Web3 from 'web3';
import { Nft } from '@/models/nft';

export enum WalletType {
  Phantom = 'Phantom',
}

export interface WalletProvider {
  available: () => boolean;
  connect: () => Promise<void>;
  tryAutoConnect: () => Promise<void>;
  disconnect: () => void;
  getWeb3: () => Web3 | undefined;
  signMessage: (message: string) => Promise<string>;
  setupPointContract: (address: {
    ethPurchaseContractAddress: string;
    neoPurchaseWalletAddress: string;
  }) => void;
  setupEnumerableNftContract: (nft: string) => void;
  listNfts: (nft: string, account?: string) => Promise<Nft[]>;
  listNftsMock: (
    // TODO Remove
    nft: string,
  ) => Promise<Nft[]>;
  getNftInfoByTokenId: (
    nft: string,
    tokenId: number,
  ) => Promise<Nft | undefined>;
  buyPoints: (price: number) => Promise<any>;
  signIn?: () => Promise<API.Jwt>;
  aiverseMint?: (
    offLineId: string,
    publishType: 'model' | 'template',
  ) => Promise<string>;
}

export type WalletProviderClass = {
  new (cb: {
    onAccountChange: (account: string) => void;
    onChainChange: (chain: string) => void;
    onDisconnect: () => void;
  }): WalletProvider;
};
