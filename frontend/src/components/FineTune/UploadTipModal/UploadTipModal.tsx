import { Button, Modal } from 'antd';
import { useIntl } from '@@/exports';
import Tabs from '@/components/Tabs/Tabs';
import { useEffect, useState } from 'react';
import { Configure } from '@/constants';

const UploadTipModal = ({
  type,
  open,
  onClose,
  footer,
  onOk,
}: {
  type: API.FineTuneType;
  open: boolean;
  onClose: VoidFunction;
  footer: boolean;
  onOk: VoidFunction;
}) => {
  const { formatMessage, locale } = useIntl();

  const [tab, setTab] = useState<API.FineTuneType>(type);

  // useEffect(() => {
  //   setTab(type);
  // }, [type]);

  return (
    <Modal
      title={null}
      footer={
        footer
          ? [
              <Button key={'close'} onClick={onClose}>
                {formatMessage({ id: 'fine-tune.model.upload-tip.close' })}
              </Button>,
              <Button key={'ok'} type={'primary'} onClick={onOk}>
                {formatMessage({ id: 'fine-tune.model.upload-tip.ok' })}
              </Button>,
            ]
          : null
      }
      closable={!footer}
      maskClosable={!footer}
      open={open}
      onCancel={onClose}
      centered={true}
      width={600}
    >
      {/*{!footer && (*/}
      {/*  <Tabs*/}
      {/*    style={{ marginBottom: 24 }}*/}
      {/*    size={'small'}*/}
      {/*    tabs={[*/}
      {/*      {*/}
      {/*        key: 'PERSON',*/}
      {/*        label: formatMessage({ id: 'fine-tune.model.upload-tip.object' }),*/}
      {/*      },*/}
      {/*      {*/}
      {/*        key: 'STYLE',*/}
      {/*        label: formatMessage({ id: 'fine-tune.model.upload-tip.style' }),*/}
      {/*      },*/}
      {/*    ]}*/}
      {/*    activeKey={tab}*/}
      {/*    onChange={(tab: any) => setTab(tab)}*/}
      {/*  />*/}
      {/*)}*/}
      <div style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center' }}>
        {tab === 'PERSON'
          ? formatMessage(
              { id: 'fine-tune.model.upload-tip.object.title' },
              {
                min: Configure.fineTune.imageCount.PERSON.min,
                max: Configure.fineTune.imageCount.PERSON.max,
              },
            )
          : formatMessage(
              { id: 'fine-tune.model.upload-tip.style.title' },
              {
                min: Configure.fineTune.imageCount.STYLE.min,
                max: Configure.fineTune.imageCount.STYLE.max,
              },
            )}
      </div>
      <div style={{ fontSize: 16, textAlign: 'center' }}>
        {tab === 'PERSON'
          ? formatMessage({ id: 'fine-tune.model.upload-tip.object.desc' })
          : formatMessage({ id: 'fine-tune.model.upload-tip.style.desc' })}
      </div>
      <div>
        {tab === 'PERSON' ? (
          <img
            src={`https://res.aiverse.cc/assets/mini/${locale}/upload-tip-person.png`}
            style={{ width: '100%' }}
          />
        ) : (
          <img
            src={`https://res.aiverse.cc/assets/mini/${locale}/upload-tip-style.png`}
            style={{ width: '100%' }}
          />
        )}
      </div>
    </Modal>
  );
};

export default UploadTipModal;
