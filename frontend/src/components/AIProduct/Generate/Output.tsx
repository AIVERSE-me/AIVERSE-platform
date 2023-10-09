import styles from './Generate.less';
import {
  CloudDownloadOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { message, Modal, Tooltip } from 'antd';
import { FourKOutlined } from '@/components/Icon';
import { useIntl } from '@@/exports';
import GENERATE_LOADING from '@/assets/generate-loading.gif';
import { useMemoizedFn, useRequest } from 'ahooks';
import ImagePreviewModal from '@/components/ImageModal/ImagePreviewModal';
import { useEffect, useState } from 'react';
import { downloadImage } from '@/utils/utils';
import useInterval from '@/hooks/useInterval';
import {
  createAIModelOutputHr,
  createAIProductOutputHr,
} from '@/services/ai-product';

export const AIProductOutput = ({
  outputType,
  output,
  onDelete,
}: {
  outputType: 'product' | 'model';
  output?: API.AIProductOutput | API.AIModelOutput;
  onDelete: () => Promise<void>;
}) => {
  const [_message, messageContextHolder] = message.useMessage();
  const [modal, modalContextHolder] = Modal.useModal();
  const { formatMessage } = useIntl();

  const [preview, setPreview] = useState(false);
  const [hrTask, setHrTask] = useState<API.HrTask | undefined>(output?.hr);

  const handleDelete = useMemoizedFn(() => {
    modal.confirm({
      title: formatMessage({
        id: 'ai-product.generate.output-action.delete-output.title',
      }),
      content: formatMessage({
        id: 'ai-product.generate.output-action.delete-output.content',
      }),
      okText: formatMessage({ id: 'model.button.delete' }),
      cancelText: formatMessage({ id: 'model.button.cancel' }),
      okButtonProps: {
        danger: true,
      },
      centered: true,
      onOk: async () => {
        await onDelete();
      },
    });
  });

  const { startInterval: startHrTaskPolling, stopInterval: stopHrTaskPolling } =
    useInterval(1000, {
      immediate: true,
    });

  useEffect(() => {
    stopHrTaskPolling();
    setHrTask(output?.hr);
  }, [output]);

  const { runAsync: createHrTask } = useRequest(
    async () => {
      try {
        const func =
          outputType === 'product'
            ? createAIProductOutputHr
            : createAIModelOutputHr;
        const hr = await func(output!.id);
        setHrTask(hr);
        _message.success(
          formatMessage({ id: 'ai-product.generate.output-action.hr-started' }),
        );
        startHrTaskPolling(async () => {
          const hr = await func(output!.id);
          setHrTask(hr);
          return hr.status === 'STARTED' || hr.status === 'CREATED';
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

  return (
    <>
      {output ? (
        output.status === 'FINISHED' ? (
          <div className={styles.output} key={'output'}>
            <div>
              <img
                className={styles.outputImage}
                src={
                  output.status === 'FINISHED'
                    ? hrTask?.imageUrl || output.imageUrl
                    : GENERATE_LOADING
                }
              />
            </div>
            <div className={styles.outputActionList}>
              <Tooltip
                placement={'right'}
                title={formatMessage({
                  id: 'ai-product.generate.output-action.view-larger-image',
                })}
              >
                <div
                  onClick={() => setPreview(true)}
                  className={styles.outputActionItem}
                >
                  <EyeOutlined />
                </div>
              </Tooltip>
              <Tooltip
                placement={'right'}
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
                <div
                  onClick={() => {
                    if (!hrTask) {
                      createHrTask();
                    }
                  }}
                  className={styles.outputActionItem}
                >
                  {hrTask?.status === 'CREATED' ||
                  hrTask?.status === 'STARTED' ? (
                    <div style={{ fontSize: 16, fontWeight: 'bold' }}>
                      {hrTask.progress}%
                    </div>
                  ) : (
                    <FourKOutlined />
                  )}
                </div>
              </Tooltip>
              <Tooltip
                placement={'right'}
                title={formatMessage({
                  id: 'ai-product.generate.output-action.download',
                })}
              >
                <div
                  onClick={() =>
                    downloadImage(
                      hrTask?.imageUrl || output.imageUrl,
                      hrTask?.id || output.id,
                    )
                  }
                  className={styles.outputActionItem}
                >
                  <CloudDownloadOutlined />
                </div>
              </Tooltip>
              <Tooltip
                placement={'right'}
                title={formatMessage({
                  id: 'ai-product.generate.output-action.delete',
                })}
              >
                <div onClick={handleDelete} className={styles.outputActionItem}>
                  <DeleteOutlined />
                </div>
              </Tooltip>
            </div>
          </div>
        ) : output.status === 'ERROR' ? (
          <div className={styles.output} key={'error'}>
            <div className={styles.outputFailed}>Error</div>
            <div className={styles.outputActionList}>
              <Tooltip
                placement={'right'}
                title={formatMessage({
                  id: 'ai-product.generate.output-action.delete',
                })}
              >
                <div onClick={handleDelete} className={styles.outputActionItem}>
                  <DeleteOutlined />
                </div>
              </Tooltip>
            </div>
          </div>
        ) : (
          <div className={styles.output} key={'loading'}>
            <div>
              <img className={styles.outputImage} src={GENERATE_LOADING} />
            </div>
          </div>
        )
      ) : (
        <div className={styles.output} />
      )}
      <ImagePreviewModal
        onClose={() => setPreview(false)}
        image={
          output && preview ? hrTask?.imageUrl || output.imageUrl : undefined
        }
        size={1000}
      />
      {messageContextHolder}
      {modalContextHolder}
    </>
  );
};
