import styles from './Card.less';
import { message, Modal, Progress, Tooltip } from 'antd';
import {
  CloudDownloadOutlined,
  DeleteOutlined,
  ExperimentOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useIntl } from '@@/exports';
import { FourKOutlined } from '@/components/Icon';
import { CornerTriangle } from '@/components/CornerTriangle/CornerTriangle';
import { useEffect, useState } from 'react';
import useInterval from '@/hooks/useInterval';
import {
  createAIModelOutputHr,
  createAIProductOutputHr,
  getAIModelOutput,
  getAIProductOutput,
} from '@/services/ai-product';
import { useRequest } from 'ahooks';
import { downloadImage } from '@/utils/utils';

const CustomTooltip = ({
  children,
  title,
  titleValue,
  onClick,
}: {
  children: any;
  title: string;
  titleValue?: any;
  onClick?: VoidFunction;
}) => {
  const { formatMessage } = useIntl();
  return (
    <Tooltip placement={'top'} title={formatMessage({ id: title }, titleValue)}>
      <div onClick={onClick} className={styles.action}>
        {children}
      </div>
    </Tooltip>
  );
};

export const AIProductCard = ({
  id,
  productImage,
  output: _output,
  type,
  outputType = 'product',
  handlers,
}: {
  id: string;
  productImage?: string;
  output?: API.AIModelOutput | API.AIProductOutput;
  type: 'output' | 'product';
  outputType?: 'product' | 'model';
  handlers: {
    onUseProduct?: VoidFunction;
    onView?: (url: string) => void;
    // onHD?: VoidFunction;
    // onDownload?: VoidFunction;
    onDelete?: VoidFunction;
  };
}) => {
  const [_message, messageContextHolder] = message.useMessage();
  const [modal, modalContextHolder] = Modal.useModal();
  const { formatMessage } = useIntl();
  const { onUseProduct, onView, onDelete } = handlers;

  const { startInterval: startOutputPolling } = useInterval(1000, {
    immediate: true,
  });

  const [output, setOutput] = useState<
    API.AIProductOutput | API.AIModelOutput | undefined
  >(_output);

  const { runAsync: createHrTask } = useRequest(
    async () => {
      if (!_output) return;
      try {
        const func =
          outputType === 'product'
            ? createAIProductOutputHr
            : createAIModelOutputHr;
        await func(_output.id);
        _message.success(
          formatMessage({ id: 'ai-product.generate.output-action.hr-started' }),
        );
        startOutputPolling(async () => {
          let o: API.AIProductOutput | API.AIModelOutput;
          if (outputType === 'product') {
            const { aiProductOutput } = await getAIProductOutput(_output.id);
            o = aiProductOutput;
          } else {
            const { aiModelOutput } = await getAIModelOutput(_output.id);
            o = aiModelOutput;
          }
          setOutput(o);
          if (o.hr) {
            return o.hr.status === 'STARTED' || o.hr.status === 'CREATED';
          }
          return o.status === 'STARTED' || o.status === 'CREATED';
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
    if (type !== 'output' || !_output) return;
    if (
      _output.status === 'STARTED' ||
      _output.status === 'CREATED' ||
      (_output.hr &&
        (_output.hr?.status === 'STARTED' || _output.hr?.status === 'CREATED'))
    ) {
      startOutputPolling(async () => {
        let o: API.AIProductOutput | API.AIModelOutput;
        if (outputType === 'product') {
          const { aiProductOutput } = await getAIProductOutput(_output.id);
          o = aiProductOutput;
        } else {
          const { aiModelOutput } = await getAIModelOutput(_output.id);
          o = aiModelOutput;
        }
        setOutput(o);
        if (o.hr) {
          return o.hr.status === 'STARTED' || o.hr.status === 'CREATED';
        }
        return o.status === 'STARTED' || o.status === 'CREATED';
      });
    }
  }, [_output]);

  return (
    <div className={styles.card}>
      {output?.hr?.status === 'FINISHED' && (
        <CornerTriangle color={'#49aa19'} size={86}>
          {formatMessage({ id: 'badge.hr' })}
        </CornerTriangle>
      )}
      {output && (
        <>
          {output.status === 'ERROR' ? (
            <div className={styles.status}>
              <div className={styles.title}>
                {formatMessage({ id: 'ai-product.generate.generate-failed' })}
              </div>
              <div className={styles.desc}>
                {formatMessage({
                  id: 'ai-product.generate.generate-failed-desc',
                })}
              </div>
            </div>
          ) : output.status === 'FINISHED' ? (
            <img src={output.imageUrls.medium} />
          ) : (
            <div className={styles.status}>
              <div className={styles.title}>
                {formatMessage(
                  { id: 'ai-product.generate.generating' },
                  { progress: Math.max(output.progress, 5) },
                )}
              </div>
              <Progress
                className={styles.progress}
                showInfo={false}
                percent={Math.max(output.progress, 5)}
              />
            </div>
          )}
        </>
      )}
      {productImage && <img src={productImage} />}

      {(output?.status === 'ERROR' ||
        output?.status === 'FINISHED' ||
        productImage) && (
        <div className={styles.meta}>
          {type === 'product' && (
            <CustomTooltip
              onClick={onUseProduct}
              title={'ai-product.generate.output-action.generate'}
            >
              <ExperimentOutlined />
            </CustomTooltip>
          )}
          {(output?.status !== 'ERROR' || productImage) && (
            <CustomTooltip
              onClick={() =>
                onView?.(
                  output?.hr?.imageUrl || output?.imageUrl || productImage!,
                )
              }
              title={'ai-product.generate.output-action.view-larger-image'}
            >
              <EyeOutlined />
            </CustomTooltip>
          )}
          {type === 'output' && output && output.status !== 'ERROR' && (
            <>
              {output.hr?.status !== 'FINISHED' && (
                <CustomTooltip
                  onClick={() => {
                    if (!output.hr) {
                      createHrTask();
                    }
                  }}
                  title={
                    output.hr
                      ? output.hr.status === 'ERROR'
                        ? 'ai-product.generate.output-action.hr-error'
                        : 'ai-product.generate.output-action.hr-progressing'
                      : 'ai-product.generate.output-action.hr'
                  }
                  titleValue={output.hr ? { progress: output.hr.progress } : {}}
                >
                  {output.hr?.status === 'CREATED' ||
                  output.hr?.status === 'STARTED' ? (
                    <div style={{ fontSize: 16, fontWeight: 'bold' }}>
                      {output.hr.progress}%
                    </div>
                  ) : (
                    <FourKOutlined />
                  )}
                </CustomTooltip>
              )}
              <CustomTooltip
                onClick={() => {
                  downloadImage(
                    output?.hr?.imageUrl || output?.imageUrl || productImage!,
                    output?.hr?.id || output?.id || id,
                  );
                }}
                title={'ai-product.generate.output-action.download'}
              >
                <CloudDownloadOutlined />
              </CustomTooltip>
            </>
          )}
          <CustomTooltip
            onClick={() => {
              modal.confirm({
                centered: true,
                maskClosable: true,
                title: formatMessage({
                  id: `ai-product.generate.output-action.delete-${type}.title`,
                }),
                content: formatMessage({
                  id: `ai-product.generate.output-action.delete-${type}.content`,
                }),
                okButtonProps: { danger: true },
                okText: formatMessage({
                  id: `ai-product.generate.output-action.delete`,
                }),
                onOk: onDelete,
              });
            }}
            title={'ai-product.generate.output-action.delete'}
          >
            <DeleteOutlined />
          </CustomTooltip>
        </div>
      )}
      {messageContextHolder}
      {modalContextHolder}
    </div>
  );
};
