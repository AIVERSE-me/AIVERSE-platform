import { useModel } from '@@/exports';
import { useRequest } from 'ahooks';
import {
  getPoint,
  getPointsPrice,
  getPurchaseContractAddress,
} from '@/services/api';
import { sleep } from '@/utils/utils';
import { ChannelToWalletType } from '@/models/wallet';
import { Configure } from '@/constants';

const usePoint = () => {
  const { walletProviders } = useModel('wallet', (state) => ({
    walletProviders: state.walletProviders,
  }));
  const { token, currentUser } = useModel('user', (state) => ({
    token: state.token,
    currentUser: state.currentUser,
  }));
  const { refreshCreativeTaskMetadata } = useModel('metadata', (state) => ({
    refreshCreativeTaskMetadata: state.refreshCreativeTaskMetadata,
  }));

  const {
    data: point,
    loading: gettingPoint,
    refreshAsync: refreshPoint,
  } = useRequest(
    async () => {
      if (!currentUser) return 0;

      const { selfPoints } = await getPoint(token);
      return selfPoints.points;
    },
    {
      refreshDeps: [currentUser],
      loadingDelay: 200,
    },
  );

  useRequest(
    async () => {
      if (!walletProviders) return;
      const { ethPurchaseContractAddress, neoPurchaseWalletAddress } =
        await getPurchaseContractAddress();
      for (const provider of Object.values(walletProviders)) {
        try {
          provider.setupPointContract({
            ethPurchaseContractAddress,
            neoPurchaseWalletAddress,
          });
        } catch (e) {}
      }
    },
    {
      refreshDeps: [walletProviders],
    },
  );

  const { data: pointPrices } = useRequest(
    async () => {
      if (!currentUser) return;

      let res: Record<string, API.PointsPrice[]> = {};
      for (const channel of Configure.rechargeChannel) {
        res[channel] = (await getPointsPrice(channel)).pointsPrices;
      }
      return res;
    },
    {
      refreshDeps: [currentUser],
    },
  );

  const { runAsync: buyPoints, loading: buyPointsLoading } = useRequest(
    async (price: number, channel: API.PurchaseChannelId) => {
      if (!walletProviders) return;

      const oldPoint = point || 0;

      await walletProviders[ChannelToWalletType[channel]].buyPoints(price);
      let newPoint = await refreshPoint();
      while (newPoint <= oldPoint) {
        await sleep(3000);
        newPoint = await refreshPoint();
      }
      refreshCreativeTaskMetadata();
    },
    { manual: true },
  );

  return {
    point,
    gettingPoint,
    refreshPoint,
    pointPrices,
    buyPoints,
    buyPointsLoading,
  };
};

export default usePoint;
