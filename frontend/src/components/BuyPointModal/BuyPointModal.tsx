import { Col, message, Modal, notification, Row } from 'antd';
import { useIntl, useModel } from '@@/exports';
import {
  CheckCircleFilled,
  LoadingOutlined,
  PayCircleFilled,
} from '@ant-design/icons';
import styles from './BuyPointModal.less';
import { useEffect, useRef, useState } from 'react';
import { useCreation, useHover, useMemoizedFn, useRequest } from 'ahooks';
import ReactCanvasConfetti from 'react-canvas-confetti';
import Tabs from '@/components/Tabs/Tabs';
import LOGO_ETH from '@/assets/logo-ethereum.svg';
import LOGO_FUSDT from '@/assets/logo-fusdt.svg';
import LOGO_USDT from '@/assets/logo-usdt.webp';
import LOGO_NEO from '@/assets/logo-neo.svg';
import LOGO_NEO_GAS from '@/assets/logo-neo-gas.png';
import LOGO_WECHAT_PAY from '@/assets/logo-wechat-pay.png';
import classNames from 'classnames';
import BindStepsModal from '@/components/BindStepsModal/BindStepsModal';
import { ChannelToWalletType } from '@/models/wallet';
import { Configure } from '@/constants';
import WechatPurchaseModal from '@/components/BuyPointModal/WechatPurchaseModal';

const ChannelData: Record<
  API.PurchaseChannelId,
  {
    style: string;
    unit: string;
    icon: React.ReactNode;
    payment: 'wallet' | 'wechat';
  }
> = {
  ETH: {
    style: styles.eth,
    unit: 'USDT',
    icon: <img src={LOGO_USDT} className={styles.unitIcon} />,
    payment: 'wallet',
  },
  NEO: {
    style: styles.neo,
    unit: 'FUSDT',
    icon: <img src={LOGO_FUSDT} className={styles.unitIcon} />,
    payment: 'wallet',
  },
  WECHAT: {
    style: styles.wechat,
    unit: '元',
    icon: <img src={LOGO_WECHAT_PAY} className={styles.unitIcon} />,
    payment: 'wechat',
  },
};

const PointCard = ({
  e,
  selected,
  onSelect,
  onBuy,
  onConnect,
  onBind,
  type,
  connectedAccount,
  bindAccount,
}: {
  e: API.PointsPrice;
  selected: boolean;
  onSelect: () => void;
  onBuy: () => Promise<void>;
  onConnect: () => Promise<void>;
  onBind: VoidFunction;
  type: API.PurchaseChannelId;
  connectedAccount?: string;
  bindAccount?: string;
}) => {
  const { buyPointsLoading } = useModel('point', (state) => ({
    buyPointsLoading: state.buyPointsLoading,
  }));
  const { formatMessage } = useIntl();
  const [modal, modalContextHolder] = Modal.useModal();
  const [_notification, notificationContextHolder] =
    notification.useNotification();
  const ref = useRef<any>(null);
  const hovered = useHover(ref);

  const [currentModal, setCurrentModal] = useState<any>();

  const sameAccount = useCreation(
    () => bindAccount && connectedAccount && bindAccount === connectedAccount,
    [bindAccount, connectedAccount],
  );

  useEffect(() => {
    if (sameAccount && currentModal) {
      currentModal.destroy();
    }
  }, [sameAccount]);

  const { runAsync: runBuy, loading: buyLoading } = useRequest(
    async () => {
      try {
        await onBuy();
        _notification.success({
          message: formatMessage({
            id: 'message.purchase-point-successful',
          }),
          description: formatMessage(
            {
              id: 'message.purchase-point-successful.desc',
            },
            {
              points: e.points + e.tempPoints,
            },
          ),
          placement: 'bottomRight',
        });
      } catch (e) {
        console.log(e);
        _notification.error({
          message: formatMessage({ id: 'message.failed-to-buy-point' }),
          description: formatMessage({
            id: 'message.failed-to-buy-point.desc',
          }),
          placement: 'bottomRight',
        });
      }
    },
    { manual: true },
  );

  const { runAsync: runConnect, loading: connectLoading } = useRequest(
    async () => {
      await onConnect();
    },
    { manual: true },
  );

  const channelData = useCreation(() => ChannelData[type], []);

  return (
    <div
      ref={ref}
      className={classNames(styles.priceCard, channelData.style, {
        [styles.priceCardSelected]: selected,
      })}
      onClick={() => {
        if (!buyLoading && !connectLoading) {
          onSelect();
        }
      }}
    >
      <div className={styles.price}>
        {channelData.icon}
        <div>{e.price}</div>
        <div className={styles.priceUnit}>{channelData.unit}</div>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'start',
          height: '100%',
        }}
      >
        <div className={styles.point}>
          <CheckCircleFilled style={{ marginRight: 6 }} />
          <b>{e.points}</b> {formatMessage({ id: 'points' })}
        </div>
        {e.tempPoints > 0 ? (
          <div className={styles.point}>
            <CheckCircleFilled style={{ marginRight: 6 }} />
            {formatMessage({ id: 'buy-point-modal.additional' })}{' '}
            <b>{e.tempPoints}</b> {formatMessage({ id: 'points' })}
          </div>
        ) : (
          <div className={styles.point} style={{ height: 22 }}></div>
        )}
        <div className={styles.total}>
          <div>{formatMessage({ id: 'buy-point-modal.total' })}</div>
          <b>{`${e.points + e.tempPoints} ${formatMessage({
            id: 'points',
          })}`}</b>
        </div>
      </div>
      <div>
        <div
          className={classNames(styles.purchaseBtn, channelData.style, {
            [styles.purchaseBtnLoading]: buyLoading,
          })}
          style={{
            bottom: selected || hovered ? 12 : -60,
          }}
          onClick={async () => {
            if (connectLoading || buyLoading || buyPointsLoading) return;

            if (type === 'WECHAT') {
              onBuy();
              return;
            }

            if (!bindAccount) {
              onBind();
            } else if (!connectedAccount) {
              runConnect();
            } else if (!sameAccount) {
              const _modal = modal.confirm({
                icon: null,
                content: (
                  <div>
                    <div>
                      {formatMessage({
                        id: 'modal.content.not-same-wallet-address',
                      })}
                    </div>
                    <div style={{ marginTop: 12 }}>
                      {formatMessage({ id: 'model.content.bound-address' })}
                    </div>
                    <div>{bindAccount}</div>
                    <div style={{ marginTop: 12 }}>
                      {formatMessage({
                        id: 'model.content.connected-address',
                      })}
                    </div>
                    <div>{connectedAccount}</div>
                  </div>
                ),
                centered: true,
                maskClosable: true,
                cancelText: formatMessage({ id: 'model.button.cancel' }),
                okText: formatMessage({ id: 'user.update-bind-button' }),
                onOk: () => {
                  setCurrentModal(undefined);
                  onBind();
                },
                onCancel: () => {
                  setCurrentModal(undefined);
                },
              });
              setCurrentModal(_modal);
            } else {
              runBuy();
            }
          }}
        >
          {(buyLoading || connectLoading) && (
            <LoadingOutlined style={{ marginRight: 12 }} />
          )}
          <div>
            {formatMessage({
              id:
                channelData.payment === 'wechat'
                  ? 'buy-point-modal.purchase'
                  : !bindAccount
                  ? 'buy-point-modal.bind-wallet'
                  : !connectedAccount
                  ? 'buy-point-modal.connect-wallet'
                  : 'buy-point-modal.purchase',
            })}
          </div>
        </div>
      </div>
      {notificationContextHolder}
      {modalContextHolder}
    </div>
  );
};

const BuyPointModal = (props: {
  open: boolean;
  onClose: () => void;
  onPurchased?: VoidFunction;
}) => {
  const { accounts, connect } = useModel('wallet', (state) => ({
    accounts: state.accounts,
    connect: state.connect,
  }));
  const {
    point,
    gettingPoint,
    refreshPoint,
    pointPrices,
    buyPoints,
    buyPointsLoading,
  } = useModel('point', (state) => ({
    point: state.point,
    gettingPoint: state.gettingPoint,
    refreshPoint: state.refreshPoint,
    pointPrices: state.pointPrices,
    buyPoints: state.buyPoints,
    buyPointsLoading: state.buyPointsLoading,
  }));
  const { registerSocketCallback, unregisterSocketCallback } = useModel(
    'socket',
    (state) => ({
      registerSocketCallback: state.registerSocketCallback,
      unregisterSocketCallback: state.unregisterSocketCallback,
    }),
  );
  const { currentUser } = useModel('user', (state) => ({
    currentUser: state.currentUser,
  }));

  const confettiRef = useRef<any>();
  const [_message, messageContextHolder] = message.useMessage();

  const [selectedPrice, setSelectedPrice] = useState(0);
  const [channel, setChannel] = useState<API.PurchaseChannelId>(
    Configure.rechargeChannel[0],
  );
  const [bindModalVisible, setBindModalVisible] = useState(false);
  const [wechatModalVisible, setWechatModalVisible] = useState(false);

  useEffect(() => {
    if (pointPrices && pointPrices[channel].length > 0) {
      setSelectedPrice(pointPrices[channel][2].price);
    }
  }, [pointPrices, channel]);

  const makeShot = useMemoizedFn((particleRatio, opts) => {
    confettiRef?.current?.({
      ...opts,
      origin: { y: 0.7 },
      particleCount: Math.floor(200 * particleRatio),
    });
  });

  const fireConfetti = useMemoizedFn(() => {
    makeShot(0.25, {
      spread: 26,
      startVelocity: 55,
    });

    makeShot(0.2, {
      spread: 60,
    });

    makeShot(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });

    makeShot(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    });

    makeShot(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  });

  useEffect(() => {
    registerSocketCallback('buy-point-modal', {
      onPurchased: (points: number) => {
        fireConfetti();
      },
    });

    return () => {
      unregisterSocketCallback('buy-point-modal');
    };
  }, [confettiRef.current]);

  const { formatMessage } = useIntl();

  const tabs = useCreation(() => {
    const config = {
      NEO: {
        key: 'NEO',
        label: formatMessage(
          { id: 'buy-point-modal.channel' },
          { channel: 'Neo', unit: 'FUSDT' },
        ),
        icon: LOGO_FUSDT,
      },
      SOLANA: {
        key: 'SOLANA',
        label: formatMessage(
          { id: 'buy-point-modal.channel' },
          { channel: 'Solana', unit: 'FUSDT' },
        ),
        icon: LOGO_FUSDT,
      },
      ETH: {
        key: 'ETH',
        label: formatMessage(
          { id: 'buy-point-modal.channel' },
          { channel: 'Ethereum', unit: 'USDT ' },
        ),
        icon: LOGO_USDT,
      },
      WECHAT: {
        key: 'WECHAT',
        label: formatMessage({ id: 'buy-point-modal.channel-wechat' }),
        icon: LOGO_WECHAT_PAY,
      },
    };
    return Configure.rechargeChannel.map((channel) => config[channel]);
  }, []);

  return (
    <Modal
      title={formatMessage({ id: 'buy-point-modal.title' })}
      footer={false}
      centered={true}
      open={props.open}
      onCancel={() => {
        if (!buyPointsLoading) {
          props.onClose();
        }
      }}
      width={900}
    >
      <div className={styles.rowBetween}>
        <Tabs
          tabs={tabs}
          tabStyle={{
            fontSize: 16,
          }}
          barHeight={4}
          activeKey={channel}
          onChange={(e: any) => {
            if (!buyPointsLoading) {
              setChannel(e);
            }
          }}
        />
        <div className={styles.pointBtn} onClick={() => refreshPoint()}>
          {gettingPoint && <LoadingOutlined style={{ marginRight: 6 }} />}
          {`${point || 0} ${formatMessage({ id: 'points' })}`}
        </div>
      </div>

      <Row gutter={[24, 24]} align={'stretch'}>
        <ReactCanvasConfetti
          key={'confetti'}
          refConfetti={(instance) => {
            confettiRef.current = instance;
          }}
          className={styles.pointConfetti}
          width={400}
          height={384}
        />
        {currentUser &&
          pointPrices?.[channel].map((e: API.PointsPrice) => (
            <Col
              span={6}
              key={`${channel}-${e.price}`}
              style={{ height: '100%', zIndex: 100 }}
            >
              <PointCard
                e={e}
                selected={selectedPrice === e.price}
                onSelect={() => {
                  if (!buyPointsLoading) {
                    setSelectedPrice(e.price);
                  }
                }}
                onBuy={async () => {
                  if (channel === 'WECHAT') {
                    setWechatModalVisible(true);
                  } else {
                    if (currentUser[channel.toLowerCase()]) {
                      await buyPoints(e.price, channel);
                      props.onPurchased?.();
                    }
                  }
                }}
                onBind={async () => setBindModalVisible(true)}
                onConnect={async () => {
                  await connect(ChannelToWalletType[channel]);
                }}
                type={channel}
                bindAccount={currentUser[channel.toLowerCase()]?.address}
                connectedAccount={accounts[ChannelToWalletType[channel]]}
              />
            </Col>
          ))}
      </Row>
      <BindStepsModal
        open={bindModalVisible}
        type={channel}
        onClose={() => setBindModalVisible(false)}
        onBind={() => {
          setBindModalVisible(false);
          _message.success(formatMessage({ id: 'message.bind-successful' }));
        }}
      />
      {wechatModalVisible && (
        <WechatPurchaseModal
          price={selectedPrice}
          open={wechatModalVisible}
          onClose={() => setWechatModalVisible(false)}
        />
      )}
      {messageContextHolder}
    </Modal>
  );
};

export default BuyPointModal;
