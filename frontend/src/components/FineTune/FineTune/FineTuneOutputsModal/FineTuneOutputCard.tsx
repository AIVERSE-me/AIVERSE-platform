import { message, Tooltip } from 'antd';
import {
  CloudDownloadOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { FourKOutlined } from '@/components/Icon';
import { downloadImage } from '@/utils/utils';
import { useIntl } from '@@/exports';
import styles from './FineTuneOutputsModal.less';
import { useEffect, useState } from 'react';
import useInterval from '@/hooks/useInterval';
import {
  createFineTuneOutputHr,
  getFineTuneOutput,
} from '@/services/fine-tune';
import { useCreation, useRequest } from 'ahooks';
import { CornerTriangle } from '@/components/CornerTriangle/CornerTriangle';

const isOutputInProgress = (output: API.FineTuneOutput) => {
  return (
    output.status === 'CREATED' ||
    output.status === 'STARTED' ||
    (output.hr &&
      (output.hr.status === 'CREATED' || output.hr.status === 'STARTED'))
  );
};

export const FineTuneOutputCard = ({
  output: _output,
  handlers,
}: {
  output: API.FineTuneOutput;
  handlers: {
    onPreview: (url: string) => void;
    onDelete: VoidFunction;
  };
}) => {
  const { formatMessage } = useIntl();
  const [_message, messageContextHolder] = message.useMessage();

  const { onPreview, onDelete } = handlers;

  const { startInterval: startOutputPolling, stopInterval: stopOutputPolling } =
    useInterval(1000, {
      immediate: true,
    });

  const [output, setOutput] = useState<API.FineTuneOutput>(_output);

  const hrTask = useCreation(() => output.hr, [output]);

  const { runAsync: createHrTask } = useRequest(
    async () => {
      try {
        const { createFinetuneOutputHr } = await createFineTuneOutputHr(
          _output.id,
        );
        setOutput({
          ...output,
          hr: createFinetuneOutputHr,
        });
        _message.success(
          formatMessage({ id: 'ai-product.generate.output-action.hr-started' }),
        );
        startOutputPolling(async () => {
          const { finetuneOutput } = await getFineTuneOutput(_output.id);
          setOutput(finetuneOutput);
          return isOutputInProgress(finetuneOutput);
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
    setOutput(_output);
    if (isOutputInProgress(_output)) {
      stopOutputPolling();
      startOutputPolling(async () => {
        const { finetuneOutput } = await getFineTuneOutput(_output.id);
        setOutput(finetuneOutput);
        return isOutputInProgress(finetuneOutput);
      });
    }
  }, [_output]);

  return (
    <div key={output.id} className={styles.outputCard}>
      {hrTask?.status === 'FINISHED' && (
        <CornerTriangle color={'#49aa19'} size={86}>
          {formatMessage({ id: 'badge.hr' })}
        </CornerTriangle>
      )}
      <img
        src={output.imageUrls.medium}
        onClick={() => onPreview(hrTask?.imageUrl || output.image)}
      />
      <div className={styles.actionList}>
        <Tooltip
          placement={'top'}
          title={formatMessage({
            id: 'collection.view-larger-image',
          })}
        >
          <EyeOutlined
            onClick={() => onPreview(hrTask?.imageUrl || output.image)}
          />
        </Tooltip>
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
            <FourKOutlined
              onClick={() => {
                if (!hrTask) {
                  createHrTask();
                }
              }}
            />
          )}
        </Tooltip>
        <Tooltip
          placement={'top'}
          title={formatMessage({
            id: 'collection.download-image',
          })}
        >
          <CloudDownloadOutlined
            onClick={() =>
              downloadImage(
                hrTask?.imageUrl || output.image,
                hrTask?.id || output.id,
              )
            }
          />
        </Tooltip>
        <Tooltip
          placement={'top'}
          title={formatMessage({ id: 'collection.delete' })}
        >
          <DeleteOutlined onClick={onDelete} />
        </Tooltip>
      </div>
      {messageContextHolder}
    </div>
  );
};
