import {
  Button,
  DatePicker,
  Input,
  message,
  Modal,
  ModalProps,
  notification,
  Select,
  Slider,
  Space,
} from 'antd';
import { history, useIntl } from '@@/exports';
import styles from './Modal.less';
import { useState } from 'react';
import { ThemeSwitch } from '@/components/Switch/Switch';
import { useRequest } from 'ahooks';
import { getFineTunePresetCatalogs } from '@/services/fine-tune';
import dayjs, { Dayjs } from 'dayjs';
import { InfoCircleOutlined } from '@ant-design/icons';
import { createMarketPersonTemplate } from '@/services/workshop';

const CreateTemplateModal = ({
  onSubmit,
  data,
  ...modalProps
}: { onSubmit: VoidFunction; data?: API.AiWorkImage } & ModalProps) => {
  const { formatMessage, locale } = useIntl();
  const [_message, messageContextHolder] = message.useMessage();
  const [_notification, notificationContextHolder] =
    notification.useNotification();

  const [name, setName] = useState('');
  const [gender, setGender] = useState<API.FineTuneGender>('MALE');
  const [templateType, setTemplateType] = useState('');
  const [charge, setCharge] = useState(1);
  const [price, setPrice] = useState(1);
  const [freeTime, setFreeTime] = useState<Dayjs | null>();

  const { data: templateTypes, loading: templateTypesLoading } = useRequest(
    async () => {
      const finetunePresetCatalogs = await getFineTunePresetCatalogs();
      setTemplateType(finetunePresetCatalogs[0]?.id);
      return finetunePresetCatalogs;
    },
  );

  const { runAsync: runSubmit, loading: submitLoading } = useRequest(
    async () => {
      if (!data) return;
      if (!name.trim()) {
        _message.info(
          formatMessage({
            id: 'workshop.create-template-modal.template-name.tip',
          }),
        );
      } else {
        await createMarketPersonTemplate(
          {
            catalog: templateType,
            displayImgUrl: (data.params as API.ImageGenerateParamsImg2Img)
              .init_images[0],
            gender,
            id: data.id,
            name,
          },
          charge
            ? freeTime
              ? { free: false, freeUntil: freeTime.toISOString(), price }
              : { free: false, price }
            : { free: true, price: 0 },
        );
        setName('');
        _notification.success({
          placement: 'bottomRight',
          message: formatMessage({
            id: 'workshop.create-template-modal.submit.title',
          }),
          description: formatMessage({
            id: 'workshop.create-template-modal.submit.content',
          }),
          btn: (
            <Button
              type={'primary'}
              onClick={() => {
                history.push(`/features/figure`, {
                  menu: 'template',
                });
              }}
            >
              {formatMessage({
                id: 'workshop.create-template-modal.submit.button',
              })}
            </Button>
          ),
        });
        onSubmit();
      }
    },
    {
      manual: true,
    },
  );

  return (
    <Modal
      width={400}
      title={formatMessage({ id: 'workshop.create-template-modal.title' })}
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
      {data && (
        <div className={styles.form}>
          <div className={styles.formItem}>
            <div className={styles.title}>
              {formatMessage({
                id: 'workshop.create-template-modal.base-image',
              })}
            </div>
            <img
              src={
                (data.params as API.ImageGenerateParamsImg2Img).init_images[0]
              }
            />
          </div>
          <div className={styles.formItem}>
            <div className={styles.title}>
              {formatMessage({
                id: 'workshop.create-template-modal.template-name',
              })}
            </div>
            <Input
              maxLength={30}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className={styles.formItem}>
            <div className={styles.title}>
              {formatMessage({
                id: 'workshop.create-template-modal.template-gender',
              })}
            </div>
            <ThemeSwitch<API.FineTuneGender>
              value={gender}
              onChange={(e) => setGender(e)}
              options={[
                {
                  key: 'MALE',
                  label: formatMessage({ id: 'fine-tune.create.gender.male' }),
                },
                {
                  key: 'FEMALE',
                  label: formatMessage({
                    id: 'fine-tune.create.gender.female',
                  }),
                },
              ]}
            />
          </div>
          <div className={styles.formItem}>
            <div className={styles.title}>
              {formatMessage({
                id: 'workshop.create-template-modal.template-type',
              })}
            </div>
            <Select
              style={{ width: '100%' }}
              options={
                templateTypes?.map((e) => ({
                  value: e.id,
                  label: locale === 'en-US' ? e.titleEn : e.titleZh,
                })) || []
              }
              value={templateType}
              onChange={(e) => setTemplateType(e)}
            />
          </div>
          <div className={styles.formItem}>
            <div className={styles.title}>
              {formatMessage({
                id: 'workshop.create-template-modal.template-charge',
              })}
            </div>
            <ThemeSwitch<number>
              value={charge}
              onChange={(e) => setCharge(e)}
              options={[
                {
                  key: 1,
                  label: formatMessage({
                    id: 'workshop.create-template-modal.template-charge.charge',
                  }),
                },
                {
                  key: 0,
                  label: formatMessage({
                    id: 'workshop.create-template-modal.template-charge.free',
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
                    id: 'workshop.create-template-modal.template-price',
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
                    id: 'workshop.create-template-modal.template-limited-free',
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
                        id: 'workshop.create-template-modal.template-limited-free.format',
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
                  id: 'workshop.create-template-modal.submit-tip',
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
              {formatMessage({
                id: 'workshop.create-template-modal.submit',
              })}
            </Button>
          </div>
        </div>
      )}
      {messageContextHolder}
      {notificationContextHolder}
    </Modal>
  );
};

export default CreateTemplateModal;
