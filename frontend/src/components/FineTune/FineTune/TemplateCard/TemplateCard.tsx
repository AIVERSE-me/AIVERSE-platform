import { useIntl, useModel } from '@@/exports';
import {
  Button,
  Divider,
  message,
  Modal,
  notification,
  Space,
  theme,
  Tooltip,
} from 'antd';
import React, { useEffect, useState } from 'react';
import styles from './TemplateCard.less';
import {
  publishMarketPersonTemplate,
  setMarketPersonTemplateHidden,
} from '@/services/workshop';
import { useMemoizedFn } from 'ahooks';
import {
  DeleteOutlined,
  ExperimentOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { getGeneratePreset } from '@/services/ai-product';
import useInterval from '@/hooks/useInterval';

interface TemplateCardProps {
  template: API.GeneratePreset;
  onSelect: VoidFunction;
  onDelete: () => Promise<void>;
}

const ConfirmFunc = {
  publish: publishMarketPersonTemplate,
  show: (id: string) => setMarketPersonTemplateHidden(false, id),
  hide: (id: string) => setMarketPersonTemplateHidden(true, id),
};

const TemplateCard = ({
  template: _template,
  onSelect,
  onDelete,
}: // onReview,
// onPublish,
TemplateCardProps) => {
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

  const [template, setTemplate] = useState<API.GeneratePreset>(_template);

  const { startInterval: startPublishPolling, polling: publishPolling } =
    useInterval(2000, {
      immediate: true,
    });

  useEffect(() => {
    setTemplate(_template);
  }, [_template]);

  const refresh = useMemoizedFn(async () => {
    setTemplate(await getGeneratePreset(template.id));
  });

  const confirm = useMemoizedFn((type: 'publish' | 'hide' | 'show') => {
    modal.confirm({
      centered: true,
      title: formatMessage({ id: `fine-tune.publish-template.${type}` }),
      content: formatMessage({
        id: `fine-tune.publish-template.${type}.desc`,
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
              const publishData = await prePublishNft(template.id, 'template');
              const txId = await provider?.aiverseMint(publishData);
              startPublishPolling(async () => {
                const _template = await getGeneratePreset(template.id);
                setTemplate(_template);
                return !_template.marketResource?.published;
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
            await ConfirmFunc[type](template.id);
            _message.success(
              formatMessage({
                id: `fine-tune.publish-template.${type}.success`,
              }),
            );
            refresh();
          }
        } catch (e) {
          console.log(e);
          _message.error(
            formatMessage({ id: `fine-tune.publish-template.${type}.failed` }),
          );
        }
      },
    });
  });

  return (
    <div className={styles.findTuneCard}>
      <div className={styles.imgWrapper}>
        <img
          src={template.displayImgUrl}
          onClick={() => {
            onSelect();
          }}
        />
      </div>
      <div className={styles.meta}>
        <div className={styles.name}>{template.name}</div>
        <div className={styles.info}>
          <div>{`${
            locale === 'zh-CN'
              ? template.catalogDetails.titleZh
              : template.catalogDetails.titleEn
          } · ${formatMessage({
            id: `fine-tune.my-template.gender.${template.gender}`,
          })}`}</div>
          <div>{new Date(template.createTime).toLocaleDateString(locale)}</div>
        </div>

        {!template.marketResource ? (
          <></>
        ) : template.marketResource.reviewStatus === 'PENDING' ? (
          <div
            className={styles.publishCard}
            style={{ background: antdToken.colorPrimaryBg }}
          >
            <div>
              {formatMessage({
                id: 'fine-tune.publish-template.title.in-review',
              })}
            </div>
          </div>
        ) : template.marketResource.reviewStatus === 'PASSED' &&
          !template.marketResource.published ? (
          <div
            className={styles.publishCard}
            style={{ background: antdToken.colorPrimaryBg }}
          >
            <div>
              {formatMessage({
                id: 'fine-tune.publish-template.title.approved',
              })}
            </div>
            <Button
              size={'small'}
              type={'primary'}
              shape={'round'}
              loading={publishPolling}
              onClick={() => confirm('publish')}
            >
              {formatMessage({ id: 'fine-tune.publish-template.publish' })}
            </Button>
          </div>
        ) : template.marketResource.reviewStatus === 'REJECTED' ? (
          <div
            className={styles.publishCard}
            style={{ background: antdToken.colorPrimaryBg }}
          >
            <div style={{ textAlign: 'center' }}>
              {formatMessage(
                { id: 'fine-tune.publish-template.title.rejected' },
                { reason: template.marketResource.reviewReason },
              )}
            </div>
          </div>
        ) : template.marketResource.published && template.marketUsage ? (
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
                  { id: 'fine-tune.publish-template.used' },
                  { count: template.marketUsage.summary.count },
                )}
              </div>
              {locale !== 'en-US' && <Divider type={'vertical'} />}
              <div>
                {formatMessage(
                  { id: 'fine-tune.publish-template.earning' },
                  { point: template.marketUsage.summary.prices },
                )}
              </div>
            </div>
            <Button
              size={'small'}
              type={'primary'}
              ghost={!template.marketResource!.hidden}
              shape={'round'}
              icon={
                template.marketResource.hidden ? (
                  <EyeOutlined />
                ) : (
                  <EyeInvisibleOutlined />
                )
              }
              onClick={() =>
                confirm(template.marketResource!.hidden ? 'show' : 'hide')
              }
            >
              {formatMessage({
                id: template.marketResource.hidden
                  ? 'fine-tune.publish-template.show'
                  : 'fine-tune.publish-template.hide',
              })}
            </Button>
          </div>
        ) : (
          <></>
        )}
        <div className={styles.actions}>
          <Tooltip
            title={formatMessage({ id: `fine-tune.my-template.generate` })}
          >
            <ExperimentOutlined className={styles.action} onClick={onSelect} />
          </Tooltip>
          {!template.marketResource?.published && onDelete && (
            <Tooltip
              title={formatMessage({ id: `fine-tune.my-template.delete` })}
            >
              <DeleteOutlined
                className={styles.action}
                onClick={() => {
                  modal.confirm({
                    centered: true,
                    title: formatMessage(
                      { id: `fine-tune.my-template.delete.title` },
                      { name: template.name },
                    ),
                    content: formatMessage({
                      id: `fine-tune.my-template.delete.content`,
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

export default TemplateCard;
