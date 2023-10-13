import { useEffect, useState } from 'react';
import {
  useCookieState,
  useLocalStorageState,
  useMemoizedFn,
  useRequest,
} from 'ahooks';
import { getCurrentUser } from '@/services/api';
import { wallet } from '@cityofzion/neon-js';
import { client, setResponseMiddleware } from '@/services';
import { WalletType } from '@/wallets';

const useUser = () => {
  const [token, setToken] = useCookieState('AIVERSE_TOKEN');
  const [pathnameBeforeSignIn, setPathnameBeforeSignIn] = useLocalStorageState(
    'pathname-before-sign-in',
  );
  const [signInType, setSignInType] = useState<'default' | WalletType>(
    'default',
  );

  const logout = useMemoizedFn(() => {
    setToken('');
    setSignInType('default');
  });

  const { data: currentUser, refresh: refreshCurrentUser } = useRequest(
    async () => {
      if (!token) return;
      const { currentUser } = await getCurrentUser(token);
      if (currentUser.neo) {
        setSignInType(WalletType.NeoLine);
        const scriptHash = wallet.getScriptHashFromPublicKey(
          currentUser.neo.publicKey,
        );
        currentUser.neo.address = wallet.getAddressFromScriptHash(scriptHash);
      } else if (currentUser.solana) {
        setSignInType(WalletType.Phantom);
      }
      return currentUser;
    },
    {
      refreshDeps: [token],
    },
  );

  const { loading: oauthLoginLoading, runAsync: oauthLogin } = useRequest(
    async (type: 'twitter') => {
      switch (type) {
        case 'twitter': {
          break;
        }
      }
    },
    { manual: true },
  );

  useEffect(() => {
    setResponseMiddleware((response: any) => {
      const err = response?.response?.errors?.[0];
      if (err && err.message === 'Unauthorized') {
        logout();
      }
    });
  }, []);

  useEffect(() => {
    if (!!token) {
      client.setHeaders({ authorization: `Bearer ${token}` });
    }
  }, [token]);

  return {
    currentUser,
    refreshCurrentUser,
    oauthLogin,
    oauthLoginLoading,
    token,
    setToken,
    logout,
    pathnameBeforeSignIn,
    setPathnameBeforeSignIn,
    signInType,
    setSignInType,
  };
};

export default useUser;
