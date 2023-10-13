import { useIntl } from '@@/exports';
import { Button, Input, message } from 'antd';
import { useState } from 'react';
import { useCreation } from 'ahooks';
import { saltHash } from '@/utils/encode';
import styles from './InvitePopoverContent.less';
import { ThemeTabs } from '@/components/Tabs/Tabs';
import classNames from 'classnames';
import { QRCodeCanvas } from 'qrcode.react';
import { copy, downloadImage } from '@/utils/utils';
import { CopyOutlined } from '@ant-design/icons';

const InvitePopoverContent = ({
  groupPhotoId,
  position,
}: {
  groupPhotoId: string;
  position: number;
}) => {
  const { formatMessage } = useIntl();
  const [_message, messageContextHolder] = message.useMessage();

  const [tab, setTab] = useState('mini');

  const hashId = useCreation(
    () => saltHash(`${groupPhotoId}:${position}`),
    [groupPhotoId, position],
  );

  const miniUrl = `https://res.aiverse.cc/assets/mini/group-photo?taskId=${groupPhotoId}&invitePosition=${hashId}`;
  const webUrl = `${
    location.href.split('?')[0]
  }?task=${groupPhotoId}&figure=${hashId}`;

  return (
    <div className={styles.invitePopoverContent}>
      <ThemeTabs
        tabs={[
          {
            key: 'mini',
            label: formatMessage({
              id: 'group-photo-model.figure-card.invite-friend.mini',
            }),
          },
          {
            key: 'web',
            label: formatMessage({
              id: 'group-photo-model.figure-card.invite-friend.web',
            }),
          },
        ]}
        value={tab}
        onChange={setTab}
        style={{ marginBottom: 6 }}
      />
      <div className={styles.inviteTip}>
        {formatMessage({
          id: `group-photo-model.figure-card.invite-friend.${tab}.desc`,
        })}
      </div>
      {tab === 'mini' ? (
        <div
          className={classNames(
            styles.qrContainer,
            'group-photo-invite-qrcode',
          )}
        >
          <QRCodeCanvas width={100} height={100} value={miniUrl} />
          <Button
            type={'primary'}
            shape={'round'}
            size={'small'}
            onClick={() => {
              const canvas: any = document.querySelector(
                '.group-photo-invite-qrcode > canvas',
              );
              downloadImage(canvas.toDataURL(), `${position}.png`);
            }}
          >
            {formatMessage({
              id: 'group-photo-model.figure-card.invite-friend.download-qrcode',
            })}
          </Button>
        </div>
      ) : (
        <Input
          value={webUrl}
          suffix={
            <CopyOutlined
              style={{ cursor: 'pointer' }}
              onClick={async () => {
                await copy(webUrl);
                _message.success(formatMessage({ id: 'message.copied' }));
              }}
            />
          }
        />
      )}
      {messageContextHolder}
    </div>
  );
};

export default InvitePopoverContent;
