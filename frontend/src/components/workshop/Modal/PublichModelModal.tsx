import {
  Button,
  DatePicker,
  Input,
  Modal,
  ModalProps,
  notification,
  Slider,
  Space,
} from 'antd';
import { useIntl } from '@@/exports';
import styles from './Modal.less';
import { useState } from 'react';
import { ThemeSwitch } from '@/components/Switch/Switch';
import { useRequest } from 'ahooks';
import dayjs, { Dayjs } from 'dayjs';
import { InfoCircleOutlined } from '@ant-design/icons';
import { submitReviewForPrivateModel } from '@/services/workshop';

const PublishModelModal = ({
  fineTune,
  onPublish,
  ...modalProps
}: {
  fineTune?: API.FineTune;
  onPublish: VoidFunction;
} & ModalProps) => {
  const { formatMessage } = useIntl();
  const [_notification, notificationContextHolder] =
    notification.useNotification();

  const [charge, setCharge] = useState(1);
  const [price, setPrice] = useState(1);
  const [freeTime, setFreeTime] = useState<Dayjs | null>();

  const { runAsync: runSubmit, loading: submitLoading } = useRequest(
    async () => {
      if (!fineTune) return;

      await submitReviewForPrivateModel(
        fineTune.id,
        charge
          ? freeTime
            ? { free: false, freeUntil: freeTime.toISOString(), price }
            : { free: false, price }
          : { free: true, price: 0 },
      );
      await _notification.success({
        placement: 'bottomRight',
        message: formatMessage({
          id: 'workshop.publish-model-modal.submit.title',
        }),
        description: formatMessage({
          id: 'workshop.publish-model-modal.submit.content',
        }),
      });
      onPublish();
    },
    {
      manual: true,
    },
  );

  return (
    <Modal
      width={400}
      title={formatMessage({ id: 'workshop.publish-model-modal.title' })}
      centered={true}
      footer={null}
      closable={true}
      onCancel={(e) => {
        if (!submitLoading) {
          modalProps.onCancel?.(e);
        }
      }}
      {...modalProps}
    >
      {fineTune && (
        <div className={styles.form}>
          <div className={styles.formItem}>
            <div className={styles.title}>
              {formatMessage({
                id: 'workshop.publish-model-modal.model-cover',
              })}
            </div>
            <img src={fineTune.inputImages[0]} />
          </div>
          <div className={styles.formItem}>
            <div className={styles.title}>
              {formatMessage({
                id: 'workshop.publish-model-modal.model-name',
              })}
            </div>
            <Input value={fineTune.index.displayName} disabled />
          </div>
          <div className={styles.formItem}>
            <div className={styles.title}>
              {formatMessage({
                id: 'workshop.publish-model-modal.model-charge',
              })}
            </div>
            <ThemeSwitch<number>
              value={charge}
              onChange={(e) => setCharge(e)}
              options={[
                {
                  key: 1,
                  label: formatMessage({
                    id: 'workshop.publish-model-modal.model-charge.charge',
                  }),
                },
                {
                  key: 0,
                  label: formatMessage({
                    id: 'workshop.publish-model-modal.model-charge.free',
                  }),
                },
              ]}
            />
          </div>
          {!!charge && (
            <>
              <div className={styles.formItem}>
                <div className={styles.title}>
                  {formatMessage({
                    id: 'workshop.publish-model-modal.model-price',
                  })}
                </div>
                <Slider
                  value={price}
                  onChange={(e) => setPrice(e)}
                  marks={{
                    1: 1,
                    5: 5,
                    10: 10,
                    15: 15,
                    20: 20,
                  }}
                  min={1}
                  max={20}
                  step={null}
                  dots={true}
                />
              </div>
              <div className={styles.formItem}>
                <div className={styles.title}>
                  {formatMessage({
                    id: 'workshop.publish-model-modal.model-limited-free',
                  })}
                </div>
                <DatePicker
                  onSelect={(e) => {
                    setFreeTime(e?.endOf('day'));
                  }}
                  value={freeTime}
                  defaultOpenValue={dayjs().endOf('day')}
                  allowClear
                  showNow={false}
                  showToday={false}
                  // showTime={true}
                  disabledDate={(current) => {
                    return current && current < dayjs().startOf('day');
                  }}
                  format={(value) =>
                    formatMessage(
                      {
                        id: 'workshop.publish-model-modal.model-limited-free.format',
                      },
                      { date: value.format('YYYY/MM/DD HH:mm:ss') },
                    )
                  }
                  style={{ width: '100%' }}
                />
              </div>
            </>
          )}
          <Space align={'start'} size={4} style={{ marginBottom: 6 }}>
            <InfoCircleOutlined />
            <div
              dangerouslySetInnerHTML={{
                __html: formatMessage({
                  id: `workshop.publish-model-modal.submit-tip-${fineTune.type}`,
                }),
              }}
            />
          </Space>
          <div style={{ textAlign: 'right' }}>
            <Button
              type={'primary'}
              shape={'round'}
              onClick={runSubmit}
              loading={submitLoading}
            >
              {formatMessage({ id: 'workshop.publish-model-modal.submit' })}
            </Button>
          </div>
        </div>
      )}
      {notificationContextHolder}
    </Modal>
  );
};

export default PublishModelModal;
