import {
  useCreation,
  useLocalStorageState,
  useMemoizedFn,
  useRequest,
} from 'ahooks';
import { useEffect, useState } from 'react';
import { WalletProvider, WalletProviderClass, WalletType } from '@/wallets';
import { shortenAccount } from '@/utils/format';
import { PhantomProvider } from '@/wallets/Phantom';

const WalletProviderType: Record<WalletType, WalletProviderClass> = {
  [WalletType.Phantom]: PhantomProvider,
};

export const ChannelToWalletType: Record<API.PurchaseChannelId, WalletType> = {
  SOLANA: WalletType.Phantom,
};

const useWallet = () => {
  const [autoConnect, setAutoConnect] = useLocalStorageState<
    Record<string, boolean>
  >('wallets-auto-connect', {
    defaultValue: Object.fromEntries(
      Object.values(WalletType).map((t) => [t, false]),
    ),
  });

  const [accounts, setAccounts] = useState<Record<WalletType, string>>({});
  const [chains, setChains] = useState<Record<WalletType, string>>({});
  const walletProviders = useCreation(() => {
    const providers: any = {};
    Object.values(WalletType).forEach((type) => {
      providers[type] = new WalletProviderType[type]({
        onAccountChange: (account) => {
          setAccounts((accounts) => ({
            ...accounts,
            [type]: account,
          }));
          setAutoConnect((value) => ({
            ...value,
            [type]: true,
          }));
        },
        onChainChange: (chain) =>
          setChains((chains) => ({
            ...chains,
            [type]: chain,
          })),
        onDisconnect: () => {
          setAccounts((accounts) => ({
            ...accounts,
            [type]: '',
          }));
          setAutoConnect((value) => ({
            ...value,
            [type]: false,
          }));
        },
      });
    });
    return providers as Record<WalletType, WalletProvider>;
  }, []);

  const walletProvider = useCreation(
    () => walletProviders[WalletType.MetaMask],
    [walletProviders],
  );

  const account = useCreation(() => accounts[WalletType.MetaMask], [accounts]);
  const shortAccount = useCreation(() => shortenAccount(account), [account]);
  const chain = useCreation(() => chains[WalletType.MetaMask], [chains]);
  const connected = useCreation(() => !!account, [account]);

  const { runAsync: connect, loading: connecting } = useRequest(
    async (type: WalletType) => {
      const provider = walletProviders[type];
      await provider.connect();
    },
    {
      manual: true,
    },
  );

  const disconnect = useMemoizedFn((type: WalletType) => {
    const provider = walletProviders[type];
    provider.disconnect();
  });

  useEffect(() => {
    if (walletProviders) {
      Object.keys(walletProviders).forEach((type) => {
        if (autoConnect[type]) {
          walletProviders[type as WalletType].tryAutoConnect();
        }
      });
    }
  }, [walletProviders]);

  return {
    connect,
    disconnect,
    connecting,
    connected,
    account,
    shortAccount,
    chain,
    walletProvider,

    walletProviders,
    accounts,
  };
};

export default useWallet;
