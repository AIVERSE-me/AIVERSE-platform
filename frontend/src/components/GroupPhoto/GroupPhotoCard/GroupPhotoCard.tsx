import Masonry from 'react-masonry-css';
import styles from './GroupPhotoCard.less';
import { downloadImage, isInProgress } from '@/utils/utils';
import { CornerTriangle } from '@/components/CornerTriangle/CornerTriangle';
import React, { useEffect, useState } from 'react';
import { useIntl, useModel } from '@@/exports';
import {
  CloseOutlined,
  CloudDownloadOutlined,
  DeleteOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { message, Modal, Progress, theme, Tooltip } from 'antd';
import { useCreation, useRequest } from 'ahooks';
import classNames from 'classnames';
import { FourKOutlined } from '@/components/Icon';
import useInterval from '@/hooks/useInterval';
import ImagePreviewModal from '@/components/ImageModal/ImagePreviewModal';
import {
  createGroupPhotoTaskHr,
  getGroupPhotoTask,
} from '@/services/group-photo';

const ActionButton = ({
  icon,
  tooltip,
  onClick,
  disabled = false,
}: {
  icon: React.ReactNode;
  tooltip: string;
  onClick: VoidFunction;
  disabled?: boolean;
}) => {
  return (
    <Tooltip title={tooltip}>
      <div
        className={classNames(styles.actionButton, {
          [styles.actionButtonDisabled]: disabled,
        })}
        onClick={() => {
          if (!disabled) {
            onClick();
          }
        }}
      >
        {icon}
      </div>
    </Tooltip>
  );
};

interface GroupPhotoCardProps {
  groupPhoto: API.GroupPhotoTask;
  handlers?: {
    onCancel?: (id: string) => void;
    onViewDetail?: (groupPhoto: API.GroupPhotoTask) => void;
    onPreviewImage?: (src: string) => void;
    onHr?: (groupPhoto: API.GroupPhotoTask) => void;
    // onDownload: VoidFunction;
    onDelete?: (id: string) => void;
  };
}

const GroupPhotoCard = ({
  groupPhoto: _groupPhoto,
  handlers = {},
}: GroupPhotoCardProps) => {
  const { currentUser } = useModel('user', (state) => ({
    currentUser: state.currentUser,
  }));
  const { formatMessage } = useIntl();
  const { token: antdToken } = theme.useToken();
  const [modal, modalContextHolder] = Modal.useModal();
  const [_message, messageContextHolder] = message.useMessage();
  const { onCancel, onViewDetail, onPreviewImage, onDelete, onHr } = handlers;

  const { startInterval: startPolling } = useInterval(1000, {
    immediate: true,
  });

  const [groupPhoto, setGroupPhoto] = useState(_groupPhoto);

  useEffect(() => {
    setGroupPhoto(_groupPhoto);
    if (
      _groupPhoto.status === 'PROGRESS' ||
      isInProgress(_groupPhoto.hr?.status || '')
    ) {
      startPolling(async () => {
        const gp = await getGroupPhotoTask(_groupPhoto.id);
        setGroupPhoto(gp);
        return (
          groupPhoto.status === 'PROGRESS' || isInProgress(gp.hr?.status || '')
        );
      });
    }
  }, [_groupPhoto]);

  const { runAsync: runCreateHr } = useRequest(
    async () => {
      try {
        await createGroupPhotoTaskHr(groupPhoto.id);
        _message.success(
          formatMessage({ id: 'ai-product.generate.output-action.hr-started' }),
        );
        startPolling(async () => {
          const gp = await getGroupPhotoTask(groupPhoto.id);
          setGroupPhoto(gp);
          const inProgress = isInProgress(gp.hr?.status || '');
          if (!inProgress) {
            onHr?.(gp);
          }
          return inProgress;
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

  const isCreator = useCreation(
    () =>
      currentUser && groupPhoto
        ? currentUser.id === groupPhoto.creatorId
        : false,
    [currentUser, groupPhoto],
  );

  return (
    <div className={styles.card}>
      <div className={styles.imageWrapper}>
        {groupPhoto.hr?.status === 'FINISHED' && (
          <CornerTriangle color={'#49aa19'} size={86}>
            {formatMessage({ id: 'badge.hr' })}
          </CornerTriangle>
        )}
        <img
          src={
            groupPhoto.status === 'FINISHED'
              ? groupPhoto.hr?.imageUrls?.medium || groupPhoto.result.medium
              : groupPhoto.template?.displayImg
          }
        />
        {groupPhoto.status === 'FAILED' && (
          <div className={styles.rowCenter}>
            {formatMessage({ id: 'group-photo.card.failed' })}
          </div>
        )}
        {groupPhoto.template &&
          groupPhoto.status === 'PROGRESS' &&
          (groupPhoto.members.length ===
          groupPhoto.template.positions.length ? (
            <div className={styles.imageMask}>
              <LoadingOutlined style={{ fontSize: 64 }} />
              {formatMessage({ id: 'creation.generating' })}
            </div>
          ) : (
            <div className={styles.imageMask}>
              <Progress
                type={'circle'}
                size={64}
                percent={
                  (groupPhoto.members.length /
                    groupPhoto.template.positions.length) *
                  100
                }
              />
              <div className={styles.rowCenter}>
                {formatMessage({ id: 'group-photo.card.progress' })}
                <TeamOutlined style={{ marginLeft: 6 }} />
                {`${groupPhoto.members.length}/${groupPhoto.template.positions.length}`}
              </div>
            </div>
          ))}
      </div>
      <div className={styles.meta}>
        {groupPhoto.status === 'PROGRESS' ? (
          <>
            {isCreator && (
              <ActionButton
                icon={<CloseOutlined />}
                tooltip={formatMessage({
                  id: 'group-photo.card.action-button.cancel',
                })}
                onClick={() => {
                  modal.confirm({
                    centered: true,
                    maskClosable: true,
                    title: formatMessage({
                      id: 'group-photo.card.action-button.cancel.title',
                    }),
                    content: formatMessage({
                      id: 'group-photo.card.action-button.cancel.desc',
                    }),
                    okText: formatMessage({
                      id: 'group-photo.card.action-button.cancel.ok',
                    }),
                    okButtonProps: { danger: true },
                    cancelText: formatMessage({
                      id: 'group-photo.card.action-button.cancel.cancel',
                    }),
                    onOk: async () => {
                      await onCancel?.(groupPhoto.id);
                    },
                  });
                }}
              />
            )}
            <ActionButton
              icon={<InfoCircleOutlined />}
              tooltip={formatMessage({
                id: 'group-photo.card.action-button.info',
              })}
              onClick={() => {
                onViewDetail?.(groupPhoto);
              }}
            />
          </>
        ) : (
          <>
            {groupPhoto.status === 'FINISHED' && (
              <ActionButton
                icon={<EyeOutlined />}
                tooltip={formatMessage({
                  id: 'ai-product.generate.output-action.view-larger-image',
                })}
                onClick={() => {
                  onPreviewImage?.(
                    groupPhoto.hr?.imageUrls?.origin ||
                      groupPhoto.result.origin,
                  );
                }}
              />
            )}
            <ActionButton
              icon={<InfoCircleOutlined />}
              tooltip={formatMessage({
                id: 'group-photo.card.action-button.info',
              })}
              onClick={() => {
                onViewDetail?.(groupPhoto);
              }}
            />
            {groupPhoto.status === 'FINISHED' && (
              <ActionButton
                icon={
                  groupPhoto.hr?.status === 'CREATED' ||
                  groupPhoto.hr?.status === 'STARTED' ? (
                    <div style={{ fontSize: 14, fontWeight: 'bold' }}>
                      {groupPhoto.hr.progress}%
                    </div>
                  ) : (
                    <FourKOutlined
                      style={{ opacity: groupPhoto.hr ? 0.5 : 1 }}
                    />
                  )
                }
                tooltip={formatMessage(
                  {
                    id: groupPhoto.hr
                      ? groupPhoto.hr.status === 'ERROR'
                        ? 'ai-product.generate.output-action.hr-error'
                        : groupPhoto.hr.status === 'FINISHED'
                        ? 'ai-product.generate.output-action.hr-finished'
                        : 'ai-product.generate.output-action.hr-progressing'
                      : 'ai-product.generate.output-action.hr',
                  },
                  groupPhoto.hr ? { progress: groupPhoto.hr.progress } : {},
                )}
                onClick={() => {
                  if (!groupPhoto.hr) {
                    runCreateHr();
                  }
                }}
              />
            )}
            {groupPhoto.status === 'FINISHED' && (
              <ActionButton
                icon={<CloudDownloadOutlined />}
                tooltip={formatMessage({
                  id: 'ai-product.generate.output-action.download',
                })}
                onClick={() => {
                  downloadImage(
                    groupPhoto.hr?.imageUrls.origin || groupPhoto.result.origin,
                    groupPhoto.hr?.id || groupPhoto.id,
                  );
                }}
              />
            )}
            <ActionButton
              icon={<DeleteOutlined />}
              tooltip={formatMessage({
                id: 'ai-product.generate.output-action.delete',
              })}
              onClick={() => {
                modal.confirm({
                  centered: true,
                  maskClosable: true,
                  title: formatMessage({
                    id: 'group-photo.card.action-button.delete.title',
                  }),
                  content: formatMessage({
                    id: 'group-photo.card.action-button.delete.desc',
                  }),
                  okText: formatMessage({
                    id: 'group-photo.card.action-button.delete.ok',
                  }),
                  okButtonProps: { danger: true },
                  cancelText: formatMessage({
                    id: 'group-photo.card.action-button.delete.cancel',
                  }),
                  onOk: async () => {
                    await onDelete?.(groupPhoto.id);
                  },
                });
              }}
            />
          </>
        )}
      </div>
      {modalContextHolder}
      {messageContextHolder}
    </div>
  );
};

interface GroupPhotoCardsProps {
  data: API.GroupPhotoTask[];
  handlers: {
    onCancel?: (id: string) => void;
    onViewDetail?: (groupPhoto: API.GroupPhotoTask) => void;
    onHr?: (groupPhoto: API.GroupPhotoTask) => void;
    onDelete?: (id: string) => void;
  };
}

const GroupPhotoCards = ({ data, handlers }: GroupPhotoCardsProps) => {
  const [previewImage, setPreviewImage] = useState('');
  return (
    <>
      <Masonry
        breakpointCols={4}
        className={styles.masonryGrid}
        columnClassName={styles.masonryGridColumn}
      >
        {data.map((e) => (
          <GroupPhotoCard
            key={e.id}
            groupPhoto={e}
            handlers={{
              ...handlers,
              onPreviewImage: (src: string) => setPreviewImage(src),
            }}
          />
        ))}
      </Masonry>
      <ImagePreviewModal
        image={previewImage}
        onClose={() => setPreviewImage('')}
      />
    </>
  );
};

export default GroupPhotoCards;
