import { Button, Input, Modal, Switch } from 'antd';
import styles from './FineTunePublishModal.less';
import { useIntl } from '@@/exports';
import { useRequest } from 'ahooks';
import { updateFineTuneIndex } from '@/services/fine-tune';
import { useEffect, useState } from 'react';
import useMessage from 'antd/es/message/useMessage';

const FineTunePublishModal = ({
  fineTuneModel,
  open,
  onClose,
  onUpdated,
}: {
  fineTuneModel: API.FineTune;
  open: boolean;
  onClose: VoidFunction;
  onUpdated: (fineTuneIndex: API.FineTuneIndex) => void;
}) => {
  const [message, messageContextHolder] = useMessage();
  const { formatMessage } = useIntl();

  const [displayName, setDisplayName] = useState('');
  const [published, setPublished] = useState(false);

  useEffect(() => {
    setDisplayName(fineTuneModel.index.displayName);
    setPublished(fineTuneModel.index.published);
  }, [fineTuneModel]);

  const {
    runAsync: runUpdateFineTuneIndex,
    loading: updateFineTuneIndexLoading,
  } = useRequest(
    async () => {
      try {
        const { updateFinetuneIndex: fineTuneIndex } =
          await updateFineTuneIndex(displayName, fineTuneModel.id, published);
        onUpdated(fineTuneIndex);
        onClose();
      } catch (e) {
        message.error(formatMessage({ id: 'fine-tune.model.publish-failed' }));
      }
    },
    {
      manual: true,
    },
  );

  return (
    <Modal
      title={formatMessage({ id: 'fine-tune.publish' })}
      centered={true}
      open={open}
      onCancel={onClose}
      footer={null}
      width={400}
    >
      <div className={styles.formItem}>
        <div className={styles.title}>
          {formatMessage({ id: 'fine-tune.model.publish.model-name' })}
        </div>
        <Input
          size={'large'}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={formatMessage({
            id: 'fine-tune.model.publish.model-name.placeholder',
          })}
          maxLength={36}
        />
      </div>
      <div className={styles.formItem}>
        <div className={styles.title}>
          {formatMessage({ id: 'fine-tune.model.publish.published' })}
        </div>
        <Switch checked={published} onChange={(e) => setPublished(e)} />
      </div>
      <div className={styles.formItem}>
        <Button
          onClick={runUpdateFineTuneIndex}
          loading={updateFineTuneIndexLoading}
          type={'primary'}
          shape={'round'}
          block={true}
          size={'large'}
        >
          {formatMessage({ id: 'fine-tune.model.publish.submit' })}
        </Button>
      </div>

      {messageContextHolder}
    </Modal>
  );
};

export default FineTunePublishModal;
