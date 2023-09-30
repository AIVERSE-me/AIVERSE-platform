import { useEffect, useRef, useState } from 'react';
import { useHover, useRequest } from 'ahooks';
import styles from './CollectionCard.less';
import { Badge, Dropdown, message, Modal, Tooltip } from 'antd';
import { copy, downloadImage } from '@/utils/utils';
import {
  AppstoreAddOutlined,
  CloudDownloadOutlined,
  DeleteOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  LikeFilled,
  LikeOutlined,
  ShareAltOutlined,
  TwitterOutlined,
} from '@ant-design/icons';
import {
  ClickFilled,
  FourKOutlined,
  ScissorOutlinedColored,
} from '@/components/Icon';
import {
  getCreativeTweetUrl,
  getCustomizedTweetUrl,
  getParallelTweetUrl,
  getSubmissionTweetUrl,
} from '@/utils/tweet';
import { useIntl, history, useModel } from '@@/exports';
import ICON_SUBMIT from '@/assets/icon-submit.webp';
import { Configure } from '@/constants';
import useInterval from '@/hooks/useInterval';
import {
  createFineTuneOutputHr,
  getFineTuneOutput,
} from '@/services/fine-tune';
import { createAigcOutputHr, getOutput } from '@/services/api';
import { CornerTriangle } from '@/components/CornerTriangle/CornerTriangle';

const CollectionCard = ({
  data: e,
  onPreviewImage,
  onPublish,
  onShare,
  onSubmit,
  onDelete,
  onTruing,
}: {
  data: API.Output;
  onPreviewImage: (image: string) => void;
  onPublish: () => Promise<void>;
  onShare: () => void;
  onSubmit: () => void;
  onDelete: () => Promise<void>;
  onTruing: () => void;
}) => {
  const { token } = useModel('user', (state) => ({
    token: state.token,
  }));

  const ref = useRef<any>();
  const hovered = useHover(ref);

  const [modal, modalContextHolder] = Modal.useModal();
  const [_message, messageContextHolder] = message.useMessage();
  const { formatMessage } = useIntl();

  const { startInterval: startHrTaskPolling } = useInterval(1000, {
    immediate: true,
  });

  const [hrTask, setHrTask] = useState<API.HrTask | undefined>(e.hr);

  const { runAsync: createHrTask } = useRequest(
    async () => {
      try {
        const { createAigcOutputHr: task } = await createAigcOutputHr(e.id);
        setHrTask(task);
        _message.success(
          formatMessage({ id: 'ai-product.generate.output-action.hr-started' }),
        );
        startHrTaskPolling(async () => {
          const { output } = await getOutput(e.id, token);
          setHrTask(output.hr);
          return (
            output.hr!.status === 'STARTED' || output.hr!.status === 'CREATED'
          );
        });
      } catch (e) {
        console.log(e);
        _message.error(
          formatMessage({ id: 'ai-product.generate.output-action.hr-failed' }),
        );
      }
    },
    { manual: true },
  );

  useEffect(() => {
    if (e.hr?.status === 'STARTED' || e.hr?.status === 'CREATED') {
      startHrTaskPolling(async () => {
        const { output } = await getOutput(e.id, token);
        setHrTask(output.hr);
        return (
          output.hr!.status === 'STARTED' || output.hr!.status === 'CREATED'
        );
      });
    }
  }, [e]);

  const _children = (
    <div style={{ position: 'relative' }}>
      <div
        ref={ref}
        className={styles.collectionCard}
        onClick={() => {
          history.push(
            `/universe/${e.type.toLowerCase()}${
              e.type === 'PARALLEL' ? '/portal' : ''
            }`,
            {
              output: e,
            },
          );
        }}
      >
        {hrTask?.status === 'FINISHED' && (
          <CornerTriangle color={'#49aa19'} size={86}>
            {formatMessage({ id: 'badge.hr' })}
          </CornerTriangle>
        )}
        <img className={styles.collectionCardCover} src={e.imageUrls.medium} />
        {e.type === 'PARALLEL' && (
          <Tooltip
            title={
              <div className={styles.gotoTooltip}>
                <ClickFilled style={{ fontSize: 20 }} />
                <div>
                  {formatMessage({ id: 'collection.goto-parallel-verse' })}
                </div>
              </div>
            }
          >
            <div
              style={{ position: 'absolute', width: '100%', height: '100%' }}
            >
              <img
                className={styles.nftCover}
                src={e.nftInfo!.image}
                style={{
                  right: hovered ? 0 : '-100%',
                }}
                loading="lazy"
              />
            </div>
          </Tooltip>
        )}
        {e.type === 'CREATIVE' && (
          <Tooltip
            title={
              <div className={styles.gotoTooltip}>
                <ClickFilled style={{ fontSize: 20 }} />
                <div>
                  {formatMessage({ id: 'collection.goto-creative-verse' })}
                </div>
              </div>
            }
          >
            <div
              className={styles.promptOutput}
              style={{
                opacity: hovered ? 1 : 0,
              }}
            >
              <div className={styles.prompt}>
                <div style={{ marginBottom: 8 }}>
                  <span className={styles.promptTitle}>AI Model:</span>
                  <span className={styles.promptModel}>
                    {(e.task.info as API.CreativeInfo).creativeModel}
                  </span>
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <span className={styles.promptTitle}>Prompt:</span>
                  <span className={styles.promptContent}>
                    {(e.task.info as API.CreativeInfo).prompt}
                  </span>
                </div>
              </div>
            </div>
          </Tooltip>
        )}
        {e.type === 'CUSTOMIZED' && (
          <Tooltip
            title={
              <div className={styles.gotoTooltip}>
                <ClickFilled style={{ fontSize: 20 }} />
                <div>
                  {formatMessage({ id: 'collection.goto-customized-verse' })}
                </div>
              </div>
            }
          >
            <div
              className={styles.promptOutput}
              style={{
                opacity: hovered ? 1 : 0,
              }}
            >
              <div className={styles.prompt}>
                <div style={{ marginBottom: 8 }}>
                  <span className={styles.promptTitle}>AI Model:</span>
                  <span className={styles.promptModel}>
                    {(e.task.info as API.CustomizedInfo).customizedModel}
                  </span>
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <span className={styles.promptTitle}>Prompt:</span>
                  <span className={styles.promptContent}>
                    {(e.task.info as API.CustomizedInfo).prompt}
                  </span>
                </div>
              </div>
            </div>
          </Tooltip>
        )}
      </div>
      <div className={styles.collectionCardActionRow}>
        <div
          className={styles.collectionCardActionItem}
          onClick={() => onPreviewImage(hrTask?.imageUrl || e.image)}
        >
          <Tooltip
            placement={'top'}
            title={formatMessage({ id: 'collection.view-larger-image' })}
          >
            <EyeOutlined />
          </Tooltip>
        </div>
        <div
          className={styles.collectionCardActionItem}
          onClick={() =>
            downloadImage(hrTask?.imageUrl || e.image, hrTask?.id || e.id)
          }
        >
          <Tooltip
            placement={'top'}
            title={formatMessage({ id: 'collection.download-image' })}
          >
            <CloudDownloadOutlined />
          </Tooltip>
        </div>
        <div
          className={styles.collectionCardActionItem}
          onClick={() => {
            if (!hrTask) {
              createHrTask();
            }
          }}
        >
          <Tooltip
            placement={'top'}
            title={formatMessage(
              {
                id: hrTask
                  ? hrTask.status === 'ERROR'
                    ? 'ai-product.generate.output-action.hr-error'
                    : hrTask.status === 'FINISHED'
                    ? 'ai-product.generate.output-action.hr-finished'
                    : 'ai-product.generate.output-action.hr-progressing'
                  : 'ai-product.generate.output-action.hr',
              },
              hrTask ? { progress: hrTask.progress } : {},
            )}
          >
            {hrTask?.status === 'CREATED' || hrTask?.status === 'STARTED' ? (
              <div style={{ fontSize: 14, fontWeight: 'bold' }}>
                {hrTask.progress}%
              </div>
            ) : (
              <FourKOutlined />
            )}
          </Tooltip>
        </div>
        {Configure.shareToTwitter && (
          <div className={styles.collectionCardActionItem}>
            <Tooltip
              placement={'top'}
              title={formatMessage({ id: 'collection.share-to-twitter' })}
            >
              <a
                href={
                  e.type === 'PARALLEL'
                    ? getParallelTweetUrl(e.nftInfo!.image, e.id)
                    : e.type === 'CREATIVE'
                    ? getCreativeTweetUrl(
                        (e.task.info as API.CreativeInfo).prompt,
                        e.id,
                      )
                    : getCustomizedTweetUrl(e.id)
                }
                rel={'noreferrer noopener'}
                target={'_blank'}
                onClick={() => onShare()}
              >
                <TwitterOutlined style={{ color: '#1D9BF0' }} />
              </a>
            </Tooltip>
          </div>
        )}
        <div
          className={
            e.published
              ? styles.collectionCardActionItemDisabled
              : styles.collectionCardActionItem
          }
          onClick={() => {
            if (e.published) return;
            modal.confirm({
              title: formatMessage({ id: 'model.title.confirm' }),
              content: formatMessage({
                id: 'collection.publish-confirm.content',
              }),
              okType: 'primary',
              okText: formatMessage({
                id: 'collection.publish-confirm.ok',
              }),
              maskClosable: true,
              centered: true,
              cancelText: formatMessage({ id: 'model.button.cancel' }),
              onOk: async () => {
                try {
                  await onPublish();
                  _message.success(
                    formatMessage({ id: 'message.publish-successful' }),
                  );
                } catch (e) {
                  _message.error(
                    formatMessage({ id: 'message.request-failed' }),
                  );
                }
              },
            });
          }}
        >
          <Tooltip
            placement={'top'}
            title={
              e.published
                ? formatMessage({ id: 'collection.published-to-gallery' })
                : formatMessage({ id: 'collection.publish-to-gallery' })
            }
          >
            <AppstoreAddOutlined />
          </Tooltip>
        </div>
        <div
          className={styles.collectionCardActionItem}
          onClick={() => {
            onTruing();
          }}
        >
          <Tooltip
            placement={'top'}
            title={formatMessage({ id: 'collection.ask-for-truing' })}
          >
            <ScissorOutlinedColored />
          </Tooltip>
        </div>
        {!e.submission && e.type === 'CREATIVE' && (
          <div className={styles.collectionCardActionItem} onClick={onSubmit}>
            <Tooltip
              placement={'top'}
              title={formatMessage({ id: 'collection.submit' })}
            >
              <img src={ICON_SUBMIT} style={{ width: 22, height: 22 }} />
            </Tooltip>
          </div>
        )}
        {!e.submission && (
          <div
            className={styles.collectionCardActionItem}
            onClick={() => {
              modal.confirm({
                title: 'CAUTION',
                content: formatMessage({
                  id: 'collection.delete-confirm.content',
                }),
                okType: 'primary',
                okButtonProps: {
                  danger: true,
                },
                okText: formatMessage({ id: 'model.button.delete' }),
                maskClosable: true,
                centered: true,
                cancelText: formatMessage({ id: 'model.button.cancel' }),
                onOk: async () => {
                  try {
                    await onDelete();
                    _message.success(
                      formatMessage({ id: 'message.delete-successful' }),
                    );
                  } catch (e) {
                    _message.error(
                      formatMessage({ id: 'message.request-failed' }),
                    );
                  }
                },
              });
            }}
          >
            <Tooltip
              placement={'top'}
              title={formatMessage({ id: 'collection.delete' })}
            >
              <DeleteOutlined />
            </Tooltip>
          </div>
        )}
        {e.submission && (
          <Dropdown
            placement={'top'}
            menu={{
              items: [
                {
                  key: 'view',
                  label: formatMessage({ id: 'collection.view-submission' }),
                  onClick: () => {
                    history.push(`/activity?id=${e.submission!.id}`);
                  },
                  icon: <InfoCircleOutlined />,
                },
                Configure.shareToTwitter
                  ? {
                      key: 'twitter',
                      label: (
                        <a
                          href={getSubmissionTweetUrl(
                            e.submission.id,
                            e.submission.activity.rule,
                          )}
                          target={'_blank'}
                          rel={'noreferrer noopener'}
                        >
                          {formatMessage({
                            id: 'collection.share-submission-with-twitter',
                          })}
                        </a>
                      ),
                      icon: <TwitterOutlined style={{ color: '#1D9BF0' }} />,
                    }
                  : null,
                {
                  key: 'link',
                  label: formatMessage({ id: 'collection.copy-share-link' }),
                  icon: <ShareAltOutlined />,
                  onClick: () => {
                    const href = window.location.href;
                    const idx = href.indexOf('?');
                    copy(
                      `${idx > -1 ? href.substring(0, idx) : href}?id=${
                        e.submission!.id
                      }`,
                    ).then(() => {
                      message.success(formatMessage({ id: 'message.copied' }));
                    });
                  },
                },
              ].filter((e) => !!e),
            }}
            className={styles.collectionCardActionItem}
          >
            <div className={styles.votes}>
              <LikeOutlined />
              <div style={{ fontSize: 16 }}>
                {Intl.NumberFormat('en-US', {
                  notation: 'compact',
                  maximumFractionDigits: 1,
                }).format(e.submission!.votes)}
              </div>
            </div>
          </Dropdown>
        )}
      </div>
      {messageContextHolder}
      {modalContextHolder}
    </div>
  );

  return e.submission ? (
    <Badge.Ribbon
      color={'green'}
      text={
        <Tooltip title={formatMessage({ id: 'collection.view-submission' })}>
          <div
            style={{ cursor: 'pointer' }}
            onClick={() => {
              history.push(`/activity?id=${e.submission!.id}`);
            }}
          >
            {formatMessage({ id: 'collection.submitted' })}
          </div>
        </Tooltip>
      }
    >
      {_children}
    </Badge.Ribbon>
  ) : (
    _children
  );
};
export default CollectionCard;
