import styles from './FineTuneCard.less';
import { useIntl, useModel } from '@@/exports';
import {
  Button,
  Divider,
  message,
  Modal,
  notification,
  Progress,
  Space,
  theme,
  Tooltip,
} from 'antd';
import {
  DeleteOutlined,
  ExperimentOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import React, { useEffect, useState } from 'react';
import useInterval from '@/hooks/useInterval';
import { getFineTune } from '@/services/fine-tune';
import { useMemoizedFn } from 'ahooks';
import {
  publishPrivateModel,
  setPrivateModelHidden,
} from '@/services/workshop';

const isInProgress = (status: API.FineTuneJobStatus) => {
  return ['CREATED', 'STARTED'].includes(status);
};

interface FineTuneCardProps {
  fineTune: API.FineTune;
  onSelect: VoidFunction;
  onDelete: () => Promise<void>;
  onReview: VoidFunction;
  // onRefresh: VoidFunction;
}

const ConfirmFunc = {
  publish: publishPrivateModel,
  show: (id: string) => setPrivateModelHidden(false, id),
  hide: (id: string) => setPrivateModelHidden(true, id),
};

const FineTuneCard = ({
  fineTune: _fineTune,
  onSelect,
  onDelete,
  onReview,
}: // onRefresh,
FineTuneCardProps) => {
  const { signInType } = useModel('user', (state) => ({
    signInType: state.signInType,
  }));
  const { walletProviders } = useModel('wallet', (state) => ({
    walletProviders: state.walletProviders,
  }));
  const { formatMessage, locale } = useIntl();
  const { token: antdToken } = theme.useToken();
  const [modal, modalContextHolder] = Modal.useModal();
  const [_message, messageContextHolder] = message.useMessage();
  const [_notification, notificationContextHolder] =
    notification.useNotification();

  const { startInterval: startFineTunePolling } = useInterval(5000, {
    immediate: true,
  });

  const { startInterval: startPublishPolling, polling: publishPolling } =
    useInterval(2000, {
      immediate: true,
    });

  const [fineTune, setFineTune] = useState<API.FineTune>(_fineTune);

  useEffect(() => {
    setFineTune(_fineTune);
    if (isInProgress(_fineTune.status)) {
      startFineTunePolling(async () => {
        const ft = (await getFineTune(_fineTune.id)).finetune;
        setFineTune(ft);
        return isInProgress(ft.status);
      });
    }
  }, [_fineTune]);

  const refresh = useMemoizedFn(async () => {
    const ft = (await getFineTune(_fineTune.id)).finetune;
    setFineTune(ft);
  });

  const confirm = useMemoizedFn((type: 'publish' | 'hide' | 'show') => {
    modal.confirm({
      centered: true,
      title: formatMessage({ id: `fine-tune.publish.${type}` }),
      content: formatMessage({
        id: `fine-tune.publish.${type}.desc`,
      }),
      okText: formatMessage({
        id: 'model.button.confirm',
      }),
      okButtonProps: {
        type: 'primary',
      },
      cancelText: formatMessage({
        id: 'model.button.cancel',
      }),
      onOk: async () => {
        try {
          if (type === 'publish' && signInType !== 'default') {
            const provider = walletProviders[signInType];
            if (provider?.aiverseMint) {
              const publishData = await prePublishNft(fineTune.id, 'model');
              const txId = await provider?.aiverseMint(publishData);
              startPublishPolling(async () => {
                const ft = (await getFineTune(_fineTune.id)).finetune;
                setFineTune(ft);
                return !ft.marketResource?.published;
              });
              _notification.success({
                message: formatMessage({
                  id: 'fine-tune.publish-template.publish.transaction-created',
                }),
                description: formatMessage(
                  {
                    id: 'fine-tune.publish-template.publish.transaction-created.desc',
                  },
                  { hash: txId },
                ),
                placement: 'bottomRight',
              });
            }
          } else {
            await ConfirmFunc[type]?.(fineTune.id);
            _message.success(
              formatMessage({ id: `fine-tune.publish.${type}.success` }),
            );
            refresh();
          }
        } catch (e) {
          console.log(e);
          _message.error(
            formatMessage({ id: `fine-tune.publish.${type}.failed` }),
          );
        }
      },
    });
  });

  return (
    <div className={styles.findTuneCard}>
      <div className={styles.imgWrapper}>
        <img
          src={fineTune.inputImages[0]}
          onClick={() => {
            if (fineTune.status === 'FINISHED') {
              onSelect();
            }
          }}
        />
        {isInProgress(fineTune.status) && (
          <div className={styles.loadingMask}>
            <Progress
              size={72}
              type={'circle'}
              strokeColor={antdToken.colorPrimary}
              percent={fineTune.progress}
            />
            <div>{formatMessage({ id: 'fine-tune.model.training' })}</div>
          </div>
        )}
        {fineTune.status === 'ERROR' && (
          <div className={styles.loadingMask}>
            <div style={{ fontSize: 40 }}>🙁</div>
            <div>{formatMessage({ id: 'fine-tune.failed.title' })}</div>
          </div>
        )}
      </div>
      <div className={styles.meta}>
        <div className={styles.name}>{fineTune.index.displayName}</div>
        <div className={styles.info}>
          <div>
            {fineTune.type === 'PERSON'
              ? `${formatMessage({
                  id: `fine-tune-modal-card.fine-tune-type.${fineTune.type.toLowerCase()}`,
                })} · ${formatMessage({
                  id: `fine-tune.create.gender.${(
                    fineTune.typeParams as any
                  ).gender.toLowerCase()}`,
                })}`
              : formatMessage({
                  id: `fine-tune-modal-card.fine-tune-type.${fineTune.type.toLowerCase()}`,
                })}
          </div>
          <div>{new Date(fineTune.createTime).toLocaleDateString(locale)}</div>
        </div>
        {fineTune.status === 'FINISHED' && (
          <>
            {!fineTune.marketResource && (
              <div
                className={styles.publishCard}
                style={{ background: antdToken.colorPrimaryBg }}
              >
                <Space size={4}>
                  {/*<Tooltip*/}
                  {/*  title={formatMessage({*/}
                  {/*    id: 'fine-tune.publish.title.publish-tip',*/}
                  {/*  })}*/}
                  {/*>*/}
                  {/*  <QuestionCircleOutlined />*/}
                  {/*</Tooltip>*/}
                  <div>
                    {formatMessage({ id: 'fine-tune.publish.title.publish' })}
                  </div>
                </Space>
                <Button
                  size={'small'}
                  type={'primary'}
                  shape={'round'}
                  onClick={onReview}
                >
                  {formatMessage({ id: 'fine-tune.publish.review' })}
                </Button>
              </div>
            )}
            {fineTune.marketResource?.reviewStatus === 'PENDING' && (
              <div
                className={styles.publishCard}
                style={{ background: antdToken.colorPrimaryBg }}
              >
                <div>
                  {formatMessage({ id: 'fine-tune.publish.title.in-review' })}
                </div>
              </div>
            )}
            {fineTune.marketResource?.reviewStatus === 'PASSED' &&
              !fineTune.marketResource.published && (
                <div
                  className={styles.publishCard}
                  style={{ background: antdToken.colorPrimaryBg }}
                >
                  <div>
                    {formatMessage({ id: 'fine-tune.publish.title.approved' })}
                  </div>
                  <Button
                    size={'small'}
                    type={'primary'}
                    shape={'round'}
                    loading={publishPolling}
                    onClick={() => confirm('publish')}
                  >
                    {formatMessage({ id: 'fine-tune.publish.publish' })}
                  </Button>
                </div>
              )}
            {fineTune.marketResource?.reviewStatus === 'REJECTED' && (
              <div
                className={styles.publishCard}
                style={{ background: antdToken.colorPrimaryBg }}
              >
                <div style={{ textAlign: 'center' }}>
                  {formatMessage(
                    { id: 'fine-tune.publish.title.rejected' },
                    { reason: fineTune.marketResource.reviewReason },
                  )}
                </div>
              </div>
            )}
            {fineTune.marketResource?.published && fineTune.marketUsage && (
              <div
                className={styles.publishCard}
                style={{ background: antdToken.colorPrimaryBg }}
              >
                <div
                  className={
                    locale === 'en-US'
                      ? styles.summaryVertical
                      : styles.summaryHorizontal
                  }
                >
                  <div>
                    {formatMessage(
                      { id: 'fine-tune.publish.used' },
                      { count: fineTune.marketUsage.summary.count },
                    )}
                  </div>
                  {locale !== 'en-US' && <Divider type={'vertical'} />}
                  <div>
                    {formatMessage(
                      { id: 'fine-tune.publish.earning' },
                      { point: fineTune.marketUsage.summary.prices },
                    )}
                  </div>
                </div>
                <Button
                  size={'small'}
                  type={'primary'}
                  ghost={!fineTune.marketResource!.hidden}
                  shape={'round'}
                  icon={
                    fineTune.marketResource.hidden ? (
                      <EyeOutlined />
                    ) : (
                      <EyeInvisibleOutlined />
                    )
                  }
                  onClick={() =>
                    confirm(fineTune.marketResource!.hidden ? 'show' : 'hide')
                  }
                >
                  {formatMessage({
                    id: fineTune.marketResource.hidden
                      ? 'fine-tune.publish.show'
                      : 'fine-tune.publish.hide',
                  })}
                </Button>
              </div>
            )}
          </>
        )}
        <div className={styles.actions}>
          {fineTune.status === 'FINISHED' && (
            <Tooltip
              title={formatMessage({ id: `fine-tune.my-model.generate` })}
            >
              <ExperimentOutlined
                className={styles.action}
                onClick={onSelect}
              />
            </Tooltip>
          )}
          {!fineTune.marketResource?.published && onDelete && (
            <Tooltip title={formatMessage({ id: `fine-tune.my-model.delete` })}>
              <DeleteOutlined
                className={styles.action}
                onClick={() => {
                  modal.confirm({
                    centered: true,
                    title: formatMessage(
                      { id: `fine-tune.my-model.delete.title` },
                      { name: fineTune.index.displayName },
                    ),
                    content: formatMessage({
                      id: `fine-tune.my-model.delete.content`,
                    }),
                    okText: formatMessage({
                      id: 'model.button.delete',
                    }),
                    okButtonProps: {
                      danger: true,
                      type: 'primary',
                    },
                    cancelText: formatMessage({
                      id: 'model.button.cancel',
                    }),
                    onOk: onDelete,
                  });
                }}
              />
            </Tooltip>
          )}
        </div>
      </div>
      {modalContextHolder}
      {messageContextHolder}
      {notificationContextHolder}
    </div>
  );
};

export default FineTuneCard;
