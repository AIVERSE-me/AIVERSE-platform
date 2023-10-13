import styles from './GroupPhotoModal.less';
import {
  Alert,
  Avatar,
  Button,
  Col,
  message,
  Modal,
  ModalProps,
  Popover,
  Progress,
  Row,
  theme,
} from 'antd';
import { useIntl, useModel } from '@@/exports';
import React, { useContext, useState } from 'react';
import { useCreation, useRequest } from 'ahooks';
import { isInProgress } from '@/utils/utils';
import classNames from 'classnames';
import {
  InfoCircleOutlined,
  LoadingOutlined,
  SelectOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { shortenUsername } from '@/utils/format';
import { saltHash } from '@/utils/encode';
import { GlobalContext, GlobalContextType } from '@/layouts';
import InvitePopoverContent from '../InvitePopoverContent/InvitePopoverContent';
import SelectFineTunePopoverContent from '@/components/GroupPhoto/SelectFineTunePopoverContent/SelectFineTunePopoverContent';
import { setGroupPhotoTaskMember } from '@/services/group-photo';

interface GroupPhotoModalProps {
  groupPhoto?: API.GroupPhotoTask;
  inviteFigureHash?: string;
  onRefresh: VoidFunction;
}

const GroupPhotoModal = ({
  groupPhoto,
  inviteFigureHash,
  onRefresh,
  ...modelProps
}: GroupPhotoModalProps & ModalProps) => {
  const { currentUser } = useModel('user', (state) => ({
    currentUser: state.currentUser,
  }));
  const { formatMessage, locale } = useIntl();
  const [_message, messageContextHolder] = message.useMessage();
  const { checkSignedIn } = useContext<GlobalContextType>(GlobalContext);
  const { token: antdToken } = theme.useToken();

  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  const { runAsync: runSetFineTune } = useRequest(
    async (fineTuneId: string, position: number) => {
      try {
        await setGroupPhotoTaskMember(fineTuneId, position, groupPhoto!.id);
        onRefresh();
      } catch (e) {
        console.log(e);
        _message.error(formatMessage({ id: 'message.request-failed' }));
      }
    },
    { manual: true },
  );

  const horizontalLayout = useCreation(
    () => imageSize.height > imageSize.width,
    [imageSize],
  );

  const invitePosition = useCreation(() => {
    if (!groupPhoto?.template || !inviteFigureHash) return undefined;
    return groupPhoto.template.positions.find(
      (e) => saltHash(`${groupPhoto.id}:${e.position}`) === inviteFigureHash,
    )?.position;
  }, [inviteFigureHash, groupPhoto]);

  const isCreator = useCreation(
    () =>
      currentUser && groupPhoto
        ? currentUser.id === groupPhoto.creatorId
        : false,
    [currentUser, groupPhoto],
  );

  const isParticipant = useCreation(
    () =>
      currentUser && groupPhoto
        ? groupPhoto.members.findIndex(
            (e) => e.userinfo.id === currentUser.id,
          ) !== -1
        : false,
    [currentUser, groupPhoto],
  );

  const inProgress = useCreation(
    () => isInProgress(groupPhoto?.status || ''),
    [groupPhoto],
  );

  const imageUrl = useCreation(
    () =>
      groupPhoto?.hr?.imageUrls.origin ||
      groupPhoto?.result.origin ||
      groupPhoto?.template?.displayImg ||
      '',
    [groupPhoto],
  );

  const participants = useCreation(
    () =>
      groupPhoto
        ? Array.from(
            new Set(
              groupPhoto.members.map(
                (item) => `${item.userinfo.id}__${item.userinfo.avatarUrl}`,
              ),
            ),
          )
        : [],
    [groupPhoto],
  );

  return (
    <Modal
      closable={true}
      centered={true}
      maskClosable={true}
      footer={null}
      title={formatMessage({ id: 'group-photo-model.title' })}
      // width={500}
      {...modelProps}
    >
      {groupPhoto && (
        <div
          className={
            horizontalLayout ? styles.horizontalLayout : styles.verticalLayout
          }
        >
          <div className={styles.layout}>
            <div className={styles.imageWrapper}>
              {imageUrl && (
                <img
                  key={imageUrl}
                  className={styles.groupPhotoImage}
                  src={imageUrl}
                  onLoad={(e) => {
                    const { naturalWidth, naturalHeight } = e.target as any;
                    setImageSize({
                      width: naturalWidth,
                      height: naturalHeight,
                    });
                  }}
                />
              )}
              {groupPhoto.status === 'PROGRESS' &&
                groupPhoto.template &&
                (groupPhoto.template.positions.length ===
                groupPhoto.members.length ? (
                  <div className={styles.maskLoading}>
                    <LoadingOutlined style={{ fontSize: 64 }} />
                    {formatMessage({ id: 'creation.generating' })}
                  </div>
                ) : (
                  <>
                    <img
                      className={classNames(
                        styles.maskImage,
                        styles.groupPhotoImage,
                      )}
                      src={groupPhoto.template.positionImg}
                    />
                    <div className={styles.maskImageTip}>
                      <InfoCircleOutlined />
                      {formatMessage({
                        id: 'group-photo-model.mask-image-tip',
                      })}
                    </div>
                  </>
                ))}
            </div>
            <div className={styles.info}>
              <div className={styles.infoRow}>
                <div className={styles.title}>
                  {formatMessage({ id: 'group-photo-model.info.create-at' })}
                </div>
                <div className={styles.desc}>
                  {new Date(groupPhoto.createTime).toLocaleString(locale)}
                </div>
              </div>
              <div className={styles.infoRow}>
                <div className={styles.title}>
                  {formatMessage({ id: 'group-photo-model.info.participants' })}
                </div>
                <div className={styles.desc}>
                  <Avatar.Group size={25} style={{ marginRight: 12 }}>
                    {participants.map((e) => {
                      const [id, avatarUrl] = e.split('__');
                      return <Avatar key={id} src={avatarUrl} />;
                    })}
                  </Avatar.Group>
                  {groupPhoto.template && (
                    <Progress
                      strokeColor={antdToken.colorPrimary}
                      steps={groupPhoto.template.positions.length}
                      percent={
                        (groupPhoto.members.length /
                          groupPhoto.template.positions.length) *
                        100
                      }
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
          {groupPhoto.status === 'FAILED' && (
            <Alert
              type={'error'}
              message={formatMessage({ id: 'group-photo.card.failed' })}
            />
          )}
          {isCreator ? (
            <div className={styles.tip}>
              <InfoCircleOutlined />
              {formatMessage({ id: 'group-photo-model.info.tip' })}
            </div>
          ) : !!invitePosition ? (
            <div className={styles.tip}>
              <InfoCircleOutlined />
              {formatMessage(
                { id: 'group-photo-model.info.participant-tip' },
                {
                  figure: (
                    <span
                      style={{
                        color: antdToken.colorPrimary,
                        fontWeight: 'bold',
                      }}
                    >{`人物${invitePosition}`}</span>
                  ),
                },
              )}
            </div>
          ) : null}
          <Row style={{ marginTop: 6 }} gutter={[12, 12]}>
            {groupPhoto.template?.positions.map(({ position }) => {
              const user = groupPhoto!.members.find(
                (e) => e.position === position,
              );
              return (
                <Col key={`position-${position}`} span={12}>
                  <div className={styles.figureCard}>
                    <div className={styles.figureHeader}>
                      <div>{`${formatMessage({
                        id: 'group-photo-model.figure',
                      })}${position}`}</div>
                      {user && (
                        <div className={styles.user}>
                          <img
                            src={user.userinfo.avatarUrl}
                            className={styles.avatar}
                          />
                          <div>{shortenUsername(user.userinfo.username)}</div>
                        </div>
                      )}
                    </div>
                    <div className={styles.figureContentWrapper}>
                      {user ? (
                        <div
                          className={classNames(
                            styles.figureContent,
                            styles.figureFineTuneImages,
                          )}
                        >
                          {user.finetuneInputImages
                            ?.slice(0, 4)
                            .map(({ small }) => (
                              <div
                                key={small}
                                className={styles.figureFineTuneImagesContainer}
                              >
                                <img src={small} />
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div
                          className={classNames(
                            styles.figureContent,
                            styles.figureContentAction,
                          )}
                        >
                          <Popover
                            placement={'top'}
                            open={!currentUser ? false : undefined}
                            title={formatMessage({
                              id: 'group-photo-model.select-fine-tune',
                            })}
                            content={
                              <SelectFineTunePopoverContent
                                onSelect={(fineTuneId) =>
                                  runSetFineTune(fineTuneId, position)
                                }
                              />
                            }
                            trigger={'click'}
                          >
                            <Button
                              icon={<SelectOutlined />}
                              shape={'round'}
                              disabled={
                                !isCreator && invitePosition !== position
                              }
                              onClick={(e) => {
                                if (!checkSignedIn()) {
                                  e.stopPropagation();
                                  e.preventDefault();
                                }
                              }}
                              type={'primary'}
                            >
                              {formatMessage({
                                id: 'group-photo-model.figure-card.select-fine-tune',
                              })}
                            </Button>
                          </Popover>
                          {isCreator && (
                            <Popover
                              content={
                                <InvitePopoverContent
                                  groupPhotoId={groupPhoto!.id}
                                  position={position}
                                />
                              }
                              title={formatMessage(
                                {
                                  id: 'group-photo-model.figure-card.invite-friend.title',
                                },
                                { figure: position },
                              )}
                              trigger="click"
                            >
                              <Button
                                shape={'round'}
                                icon={<UserAddOutlined />}
                              >
                                {formatMessage({
                                  id: 'group-photo-model.figure-card.invite-friend',
                                })}
                              </Button>
                            </Popover>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Col>
              );
            })}
          </Row>
        </div>
      )}
      {messageContextHolder}
    </Modal>
  );
};

export default GroupPhotoModal;
