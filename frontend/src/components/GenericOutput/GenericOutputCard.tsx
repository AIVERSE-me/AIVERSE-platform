import styles from './OutputCard.less';
import { message, Skeleton, theme } from 'antd';
import { useIntl } from '@@/exports';
import { useCreation, useRequest } from 'ahooks';
import React, {
  ForwardedRef,
  forwardRef,
  useImperativeHandle,
  useState,
} from 'react';
import ImagePreviewModal from '@/components/ImageModal/ImagePreviewModal';
import GENERATE_LOADING from '@/assets/generate-loading.gif';
import { CornerTriangle } from '@/components/CornerTriangle/CornerTriangle';
import {
  GenericOutputBasicType,
  GenericOutputServices,
} from '@/components/GenericOutput/GenericOutputPanel';
import useInterval from '@/hooks/useInterval';
import {
  isHrInProgress,
  isOutputInProgress,
} from '@/components/GenericOutput/utils';
import GenericOutputCardActionList, {
  GenericOutputActionType,
} from '@/components/GenericOutput/GenericOutputCardActionList';

export interface GenericOutputCardRefs {
  refresh: VoidFunction;
}

interface GenericOutputCardProps<T> {
  outputId?: string;
  style?: React.CSSProperties;
  size?: number;
  services: GenericOutputServices<T>;
  actions: GenericOutputActionType[];
  handlers?: {
    onOneMore?: (item: T) => void;
    onDelete?: (id: string) => Promise<void>;
    onHr?: (id: string) => Promise<void>;
    onRepaint?: (item: T) => void;
    onTemplate?: (item: T) => void;
  };
}

function GenericOutputCard<T extends GenericOutputBasicType>(
  {
    outputId,
    style = {},
    size = 450,
    services,
    actions,
    handlers,
  }: GenericOutputCardProps<T>,
  ref: ForwardedRef<GenericOutputCardRefs>,
) {
  const { startInterval: startPolling, stopInterval: stopPolling } =
    useInterval(1000, {
      immediate: true,
    });

  const { formatMessage } = useIntl();
  const [_message, messageContextHolder] = message.useMessage();
  const { token: antdToken } = theme.useToken();
  const { onOneMore, onDelete, onHr, onRepaint, onTemplate } = handlers || {};

  const [imagePreview, setImagePreview] = useState('');
  const [output, setOutput] = useState<T>();

  const { refreshAsync: refreshOutput } = useRequest(
    async () => {
      if (!outputId) {
        stopPolling();
        return;
      }

      const _output = await services.getOutput(outputId);
      setOutput(_output);

      if (isOutputInProgress(_output) || isHrInProgress(_output)) {
        startPolling(async () => {
          const o = await services.getOutput(_output.id);
          setOutput(o);
          return isOutputInProgress(o) || isHrInProgress(o);
        });
      } else {
        stopPolling();
      }
    },
    {
      refreshDeps: [outputId],
    },
  );

  const { runAsync: runDeleteOutput } = useRequest(
    async () => {
      try {
        await services.deleteOutput(output!.id);
        onDelete?.(output!.id);
        _message.success(formatMessage({ id: 'message.delete-successful' }));
      } catch (e) {
        console.log(e);
        _message.error(formatMessage({ id: 'message.request-failed' }));
      }
    },
    {
      manual: true,
    },
  );

  const { runAsync: createHrTask } = useRequest(
    async () => {
      try {
        await services.createHrTask(output!.id);
        onHr?.(output!.id);
        refreshOutput();
        _message.success(
          formatMessage({ id: 'ai-product.generate.output-action.hr-started' }),
        );
      } catch (e) {
        console.log(e);
        _message.error(
          formatMessage({ id: 'ai-product.generate.output-action.hr-failed' }),
        );
      }
    },
    { manual: true },
  );

  useImperativeHandle(ref, () => ({
    refresh: refreshOutput,
  }));

  const imageUrl = useCreation(
    () =>
      output ? output.hr?.imageUrls.origin || output.imageUrls.origin : '',
    [output],
  );

  return (
    <div className={'output-card'} style={style}>
      {output ? (
        <div className={styles.row}>
          <div className={styles.card} style={{ width: size, height: size }}>
            {outputId !== output.id ? (
              <div style={{ height: '100%' }}>
                <Skeleton.Button active={true} />
              </div>
            ) : output.status === 'FINISHED' ? (
              <div
                onClick={() => setImagePreview(imageUrl)}
                className={styles.cardImageContainer}
              >
                {output.hr?.status === 'FINISHED' && (
                  <CornerTriangle color={'#49aa19'} size={86}>
                    {formatMessage({ id: 'badge.hr' })}
                  </CornerTriangle>
                )}
                <img className={styles.cardImage} src={imageUrl} />
              </div>
            ) : output.status === 'FAILED' ? (
              <div className={styles.errorWrapper}>
                <div className={styles.errorTitle}>
                  {formatMessage({ id: 'modal.task-failed.title' })}
                </div>
                <div className={styles.errorDesc}>
                  {output.error === 'NSFW'
                    ? formatMessage({ id: 'model.task-failed.nsfw' })
                    : formatMessage({ id: 'model.task-failed.busy' })}
                </div>
              </div>
            ) : (
              <div className={styles.loadingWrapper}>
                <img
                  style={{ width: '100%', height: '100%', borderRadius: 8 }}
                  src={GENERATE_LOADING}
                />
              </div>
            )}
          </div>
          <GenericOutputCardActionList<T>
            actions={actions}
            onAction={{
              onOneMore: () => {
                onOneMore?.(output);
              },
              onDelete: runDeleteOutput,
              onHr: createHrTask,
              onRepaint: () => {
                onRepaint?.(output);
              },
              onTemplate: () => {
                onTemplate?.(output);
              },
            }}
            output={output}
          />
        </div>
      ) : (
        <div className={styles.row}>
          <div
            className={styles.card}
            style={{
              width: size,
              height: size,
              background: antdToken.colorPrimaryBg,
            }}
          ></div>
          <GenericOutputCardActionList<T> actions={actions} />
        </div>
      )}
      {messageContextHolder}
      <ImagePreviewModal
        size={800}
        onClose={() => setImagePreview('')}
        image={imagePreview}
      />
    </div>
  );
}

export default forwardRef(GenericOutputCard);
