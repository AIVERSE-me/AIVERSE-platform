import { Button, Modal, Progress, Skeleton, Space } from 'antd';
import styles from './FineTuneOutputsModal.less';
import { useIntl } from '@@/exports';
import Masonry from 'react-masonry-css';
import { useRequest } from 'ahooks';
import { useRef, useState } from 'react';
import { copy } from '@/utils/utils';
import useMessage from 'antd/es/message/useMessage';
import ImagePreviewModal from '@/components/ImageModal/ImagePreviewModal';
import { deleteFineTuneOutput, getFineTuneOutputs } from '@/services/fine-tune';
import { DeleteOutlined } from '@ant-design/icons';
import useModal from 'antd/es/modal/useModal';
import { MacScrollbar } from 'mac-scrollbar';
import { FineTuneOutputCard } from '@/components/FineTune/FineTuneOutputsModal/FineTuneOutputCard';

const pageSize = 9999;

const FineTuneOutputsModal = ({
  fineTuneToken,
  fineTuneId,
  open,
  onClose,
}: {
  fineTuneToken: string;
  fineTuneId: string;
  open: boolean;
  onClose: VoidFunction;
}) => {
  const listRef = useRef<any>();

  const [modal, modalContextHolder] = useModal();
  const [message, messageContextHolder] = useMessage();
  const { formatMessage } = useIntl();

  const [imagePreview, setImagePreview] = useState('');

  const { data: fineTuneOutputs, mutate: mutateFineTuneOutputs } = useRequest(
    async () => {
      if (!open) return;
      const { finetuneOutputs } = await getFineTuneOutputs(
        fineTuneId,
        pageSize,
      );
      return finetuneOutputs;
    },
    {
      refreshDeps: [open],
    },
  );

  const { runAsync: runDeleteFineTuneOutput } = useRequest(
    async (id: string, isFailure = false) => {
      modal.confirm({
        title: formatMessage({
          id: 'model.title.caution',
        }),
        content: formatMessage({
          id: isFailure
            ? 'collection.delete-failed-confirm.content'
            : 'collection.delete-confirm.content',
        }),
        okType: 'primary',
        okButtonProps: {
          danger: true,
        },
        okText: formatMessage({
          id: 'model.button.delete',
        }),
        maskClosable: true,
        centered: true,
        cancelText: formatMessage({
          id: 'model.button.cancel',
        }),
        onOk: async () => {
          try {
            await deleteFineTuneOutput(id);
            mutateFineTuneOutputs(fineTuneOutputs!.filter((e) => e.id !== id));
            message.success(
              formatMessage({
                id: 'message.delete-successful',
              }),
            );
          } catch (e) {
            message.error(
              formatMessage({
                id: 'message.request-failed',
              }),
            );
          }
        },
      });
    },
    { manual: true },
  );

  return (
    <Modal
      className={'fine-tune-outputs-modal'}
      title={formatMessage(
        { id: 'fine-tune.collections' },
        { token: fineTuneToken },
      )}
      centered={true}
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      <div ref={listRef} style={{ overflowY: 'auto', maxHeight: 600 }}>
        <div style={{ height: 24 }} />
        <Masonry
          breakpointCols={4}
          className={styles.masonryGrid}
          columnClassName={styles.masonryGridColumn}
        >
          {fineTuneOutputs === undefined
            ? new Array(8)
                .fill(0)
                .map((e, index) => <Skeleton.Image active={true} key={index} />)
            : fineTuneOutputs.map((output) =>
                output.status !== 'FINISHED' ? (
                  <div key={output.id} className={styles.failedCard}>
                    <Progress
                      style={{ marginBottom: 6 }}
                      size={64}
                      type="circle"
                      percent={output.progress}
                      status={
                        output.status === 'ERROR' ? 'exception' : undefined
                      }
                    />
                    {output.error !== 'NONE' ? (
                      <>
                        <div className={styles.title}>
                          {formatMessage({ id: 'fine-tune.model.task-failed' })}
                        </div>
                        <div className={styles.desc}>
                          {formatMessage({
                            id: 'fine-tune.model.task-failed.desc',
                          })}
                        </div>
                        <Space>
                          <Button
                            size={'small'}
                            shape={'round'}
                            onClick={() => {
                              copy(output.prompt).then(() => {
                                message.success(
                                  formatMessage({ id: 'message.copied' }),
                                );
                              });
                            }}
                          >
                            {formatMessage({
                              id: 'fine-tune.model.task-failed.copy-prompt',
                            })}
                          </Button>
                          <Button
                            icon={<DeleteOutlined />}
                            shape={'circle'}
                            size={'small'}
                            onClick={() => {
                              runDeleteFineTuneOutput(output.id, true);
                            }}
                          />
                        </Space>
                      </>
                    ) : (
                      <div className={styles.title}>
                        {formatMessage({ id: 'fine-tune.model.task-started' })}
                      </div>
                    )}
                  </div>
                ) : (
                  <FineTuneOutputCard
                    output={output}
                    handlers={{
                      onPreview: (url: string) => setImagePreview(url),
                      onDelete: () => runDeleteFineTuneOutput(output.id),
                    }}
                  />
                ),
              )}
        </Masonry>
      </div>
      <ImagePreviewModal
        image={imagePreview}
        onClose={() => setImagePreview('')}
      />
      {modalContextHolder}
      {messageContextHolder}
    </Modal>
  );
};

export default FineTuneOutputsModal;
