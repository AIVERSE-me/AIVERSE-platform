import styles from './LoginCard.less';
import { LoadingOutlined } from '@ant-design/icons';
import { useIntl, useLocation, useModel } from '@@/exports';
import classNames from 'classnames';

import { AuthType, Configure } from '@/constants';
import { useState } from 'react';
import useDevice from '@/hooks/useDevice';
import { message } from 'antd';
import { BindTypes } from '@/components/BindStepsModal/BindStepsModal';
import { useRequest } from 'ahooks';
import { WalletProvider, WalletType } from '@/wallets';

const LoginCard = ({
  centered = false,
  border = false,
  redirectPath,
  onSignedIn,
}: {
  centered?: boolean;
  border?: boolean;
  redirectPath?: string;
  onSignedIn: VoidFunction;
}) => {
  const { walletProviders } = useModel('wallet', (state) => ({
    walletProviders: state.walletProviders,
  }));
  const { setToken, setSignInType, setPathnameBeforeSignIn } = useModel(
    'user',
    (state) => ({
      setToken: state.setToken,
      setSignInType: state.setSignInType,
      setPathnameBeforeSignIn: state.setPathnameBeforeSignIn,
    }),
  );
  const { formatMessage } = useIntl();
  const { pathname, search } = useLocation();
  const { isMobile } = useDevice();
  const [_message, messageContextHolder] = message.useMessage();

  const [loading, setLoading] = useState<AuthType | undefined>();

  const { runAsync: runWalletSignIn } = useRequest(
    async (provider: WalletProvider, walletType: WalletType) => {
      if (!provider.signIn) {
        setLoading(undefined);
        return;
      }

      try {
        await provider.connect();
        const { token, expireAt } = await provider.signIn?.();
        setSignInType(walletType);
        onSignedIn();
        setToken(token, {
          expires: Number(expireAt) * 1000,
        });
      } catch (e) {
        console.log(e);
        _message.error(formatMessage({ id: 'login-card.sign-in-failed' }));
      }
      setLoading(undefined);
    },
    {
      manual: true,
    },
  );

  return (
    <div
      className={classNames(styles.card, {
        [styles.cardCentered]: centered,
        [styles.cardBorder]: border,
        [styles.cardMobile]: isMobile,
      })}
    >
      <div className={styles.title}>
        {formatMessage({ id: 'user.sign-in-to-aiverse' })}
      </div>
      {Configure.authorization
        .filter((a) => a.enabled)
        .map((a) => (
          <a
            key={a.type}
            href={a.url}
            rel={'noreferrer noopener'}
            onClick={async (e) => {
              if (loading) {
                e.preventDefault();
                e.stopPropagation();
                return;
              }

              if (!a.url) {
                e.preventDefault();
                e.stopPropagation();

                if (a.wallet && walletProviders[a.wallet]) {
                  const provider = walletProviders[a.wallet];
                  const available = await provider.available();
                  if (!available) {
                    const site = BindTypes.find(
                      (b) => b.chainName === a.type,
                    )?.site;
                    if (!!site) {
                      window.open(site, '_blank', 'noreferrer,noopener');
                    }
                  } else {
                    setLoading(a.type);
                    await runWalletSignIn(provider, a.wallet);
                  }
                } else {
                  _message.info(formatMessage({ id: 'coming-soon' }));
                }
              } else {
                setPathnameBeforeSignIn(redirectPath || `${pathname}${search}`);
                setLoading(a.type);
              }
            }}
            className={classNames(styles.loginBtn, {
              [styles.loginBtnDisabled]: !!loading,
            })}
            style={{
              background: a.background,
              color: a.color,
            }}
          >
            {loading === a.type && (
              <LoadingOutlined className={styles.loading} />
            )}
            <img src={a.icon} className={styles.logo} />
            <div>{formatMessage({ id: a.label })}</div>
          </a>
        ))}
      {messageContextHolder}
    </div>
  );
};

export default LoginCard;
