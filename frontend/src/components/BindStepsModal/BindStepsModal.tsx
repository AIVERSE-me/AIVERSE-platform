import { useIntl, useModel } from '@@/exports';
import { useEffect, useState } from 'react';
import { useCreation, useMemoizedFn, useRequest } from 'ahooks';
import { getBindMessage } from '@/utils/utils';
import { Alert, Button, ConfigProvider, message, Modal, Steps } from 'antd';
import styles from './BindStepsModal.less';
import { WalletType } from '@/wallets';
import LOGO_ETHEREUM from '@/assets/logo-ethereum.svg';
import LOGO_METAMASK from '@/assets/metamask-icon-64.png';
import LOGO_NEO from '@/assets/logo-neo.svg';
import LOGO_NEOLINE from '@/assets/neoline-icon-48.png';
import LOGO_SOLANA from '@/assets/logo-solana.svg';
import LOGO_PHANTOM from '@/assets/logo-phantom.png';
import { bindAccount } from '@/services/api';

export interface BindType {
  bindType: 'eth' | 'neo' | 'solana';
  chainIcon: string;
  chainName: string;
  walletIcon: string;
  walletName: string;
  walletType: WalletType;
  site: string;
  themeColor: string;
}

export interface BindStepsDataType extends BindType {
  available: boolean;
  account?: string;
}

export const BindTypes: BindType[] = [
  {
    bindType: 'eth',
    chainIcon: LOGO_ETHEREUM,
    chainName: 'Ethereum',
    walletIcon: LOGO_METAMASK,
    walletName: 'MetaMask',
    walletType: WalletType.MetaMask,
    site: 'https://metamask.io/',
    themeColor: '#ff7324',
  },
  {
    bindType: 'neo',
    chainIcon: LOGO_NEO,
    chainName: 'Neo',
    walletIcon: LOGO_NEOLINE,
    walletName: 'NeoLine',
    walletType: WalletType.NeoLine,
    site: 'https://neoline.io/',
    themeColor: '#00e599',
  },
  {
    bindType: 'solana',
    chainIcon: LOGO_SOLANA,
    chainName: 'Solana',
    walletIcon: LOGO_PHANTOM,
    walletName: 'Phantom',
    walletType: WalletType.Phantom,
    site: 'https://phantom.app/',
    themeColor: '#ab9ff2',
  },
];

let signMessageInterval: any;

const BindStepsModal = ({
  open,
  type,
  onClose,
  onBind,
}: {
  open?: boolean;
  type?: string;
  onClose: VoidFunction;
  onBind: VoidFunction;
}) => {
  const { walletProviders, accounts } = useModel('wallet', (state) => ({
    walletProviders: state.walletProviders,
    accounts: state.accounts,
  }));
  const { currentUser, token, refreshCurrentUser } = useModel(
    'user',
    (state) => ({
      currentUser: state.currentUser,
      token: state.token,
      refreshCurrentUser: state.refreshCurrentUser,
    }),
  );
  const { formatMessage } = useIntl();

  const [signMessage, setSignMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);

  const data = useCreation(() => {
    if (!!type) {
      return BindTypes.find(
        (e) => e.bindType.toLowerCase() === type.toLowerCase(),
      )!;
    }
  }, [type]);
  const available = useCreation(
    () => (data ? walletProviders[data.walletType].available() : false),
    [data, walletProviders, open],
  );
  const account = useCreation(
    () => (data ? accounts[data.walletType] : ''),
    [data, accounts],
  );
  const isUpdate = useCreation(
    () => data && currentUser?.[data.bindType],
    [data],
  );

  const { loading: connecting, run: runConnect } = useRequest(
    async () => {
      const provider = walletProviders[data!.walletType];
      await provider.connect();
    },
    { manual: true },
  );

  const { loading: binding, run: runSignAndBind } = useRequest(
    async () => {
      const { walletType, bindType } = data!;
      const provider = walletProviders[walletType];
      const signature = await provider.signMessage(signMessage);
      await bindAccount(
        bindType,
        signMessage,
        account!,
        walletType,
        signature,
        token,
      );
      refreshCurrentUser();
      onBind();
    },
    {
      manual: true,
    },
  );

  const currentStep = useCreation(() => {
    if (!data) return 0;
    if (!available) return 0;
    if (!account) return 1;
    return 2;
  }, [data, available, account]);

  useEffect(() => {
    setShowAlert(isUpdate);
  }, [isUpdate, data]);

  const stopUpdateSignMessage = useMemoizedFn(() => {
    if (signMessageInterval) {
      clearInterval(signMessageInterval);
      signMessageInterval = undefined;
    }
  });

  const startUpdateSignMessage = useMemoizedFn(() => {
    stopUpdateSignMessage();
    signMessageInterval = setInterval(() => {
      setSignMessage(getBindMessage(data!.bindType));
    }, 1000);
  });

  useEffect(() => {
    if (data && open) {
      if (binding) {
        stopUpdateSignMessage();
      } else {
        setSignMessage(getBindMessage(data!.bindType));
        startUpdateSignMessage();
      }
    }
  }, [data, open, binding]);

  useEffect(() => {
    return () => {
      stopUpdateSignMessage();
    };
  }, []);

  return (
    <ConfigProvider
      theme={
        data
          ? {
              token: {
                colorPrimary: data.themeColor,
              },
            }
          : {}
      }
    >
      <Modal
        className={styles.bindModal}
        open={open && !!type}
        onCancel={() => {
          if (!binding && !connecting) {
            onClose();
          }
        }}
        centered={true}
        footer={null}
        title={
          <div
            className={styles.modalTitle}
            style={{ display: 'flex', alignItems: 'center' }}
          >
            <img src={data?.chainIcon} />
            <span>
              {formatMessage(
                {
                  id: isUpdate
                    ? 'user.update-bind-step.title'
                    : 'user.bind-step.title',
                },
                { name: data?.chainName },
              )}
            </span>
          </div>
        }
      >
        {data && (
          <Steps
            current={currentStep}
            direction="vertical"
            size="small"
            items={[
              {
                title: formatMessage(
                  { id: 'user.bind-step-install.title' },
                  { name: data.walletName },
                ),
                description: (
                  <div>
                    <img
                      src={data.walletIcon}
                      style={{
                        height: 36,
                        marginTop: 12,
                        objectFit: 'contain',
                      }}
                    />
                    <p style={{ whiteSpace: 'pre-wrap' }}>
                      {formatMessage(
                        {
                          id: available
                            ? 'user.bind-step-install.desc-available'
                            : 'user.bind-step-install.desc-unavailable',
                        },
                        { name: data.walletName },
                      )}
                    </p>
                    {!available && (
                      <Button
                        target={'_blank'}
                        href={data.site}
                        rel={'noreferrer noopener'}
                        shape={'round'}
                        type={'primary'}
                      >
                        {formatMessage(
                          { id: 'user.bind-step-install.install-extension' },
                          { name: data.walletName },
                        )}
                      </Button>
                    )}
                  </div>
                ),
              },
              {
                title: formatMessage(
                  { id: 'user.bind-step-connect.title' },
                  { name: data.walletName },
                ),
                description: currentStep >= 1 && (
                  <div>
                    {!!account ? (
                      <>
                        <p>
                          {formatMessage(
                            {
                              id: 'user.bind-step-connect.desc-connected',
                            },
                            { name: data.walletName },
                          )}
                        </p>
                        <p className={styles.account}>{account}</p>
                      </>
                    ) : (
                      <>
                        <p>
                          {formatMessage({
                            id: 'user.bind-step-connect.desc-not-connected',
                          })}
                        </p>
                        <Button
                          shape={'round'}
                          type={'primary'}
                          loading={connecting}
                          onClick={runConnect}
                        >
                          {formatMessage(
                            {
                              id: 'user.bind-step-connect.connect-wallet',
                            },
                            { name: data.walletName },
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                ),
              },
              {
                title: formatMessage({ id: 'user.bind-step-sign.title' }),
                description: currentStep === 2 && (
                  <div>
                    <p>{formatMessage({ id: 'user.bind-step-sign.desc' })}</p>
                    <p className={styles.alert} style={{ minHeight: 22 }}>
                      {signMessage}
                    </p>
                    {showAlert ? (
                      <Alert
                        showIcon={true}
                        style={{ marginBottom: 8, padding: '8px 12px' }}
                        type={'warning'}
                        description={
                          <div>
                            <div style={{ marginBottom: 8 }}>
                              {formatMessage({
                                id: 'user.update-bind-step.alert',
                              })}
                            </div>
                            <Button
                              shape={'round'}
                              size={'small'}
                              type={'primary'}
                              onClick={() => setShowAlert(false)}
                            >
                              {formatMessage({ id: 'model.button.ok' })}
                            </Button>
                          </div>
                        }
                      />
                    ) : (
                      <Button
                        shape={'round'}
                        type={'primary'}
                        loading={binding}
                        onClick={runSignAndBind}
                      >
                        {formatMessage({
                          id: 'user.bind-step-sign.desc-sign-and-bind',
                        })}
                      </Button>
                    )}
                  </div>
                ),
              },
            ]}
          />
        )}
      </Modal>
    </ConfigProvider>
  );
};

export default BindStepsModal;
