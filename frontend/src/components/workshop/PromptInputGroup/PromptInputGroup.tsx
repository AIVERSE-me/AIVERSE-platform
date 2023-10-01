import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import styles from '@/components/workshop/index.less';
import { ThemeTabs } from '@/components/Tabs/Tabs';
import { QuestionCircleOutlined, UndoOutlined } from '@ant-design/icons';
import { Button, Input, message } from 'antd';
import { useIntl, useModel } from '@@/exports';
import { useRequest } from 'ahooks';
import useInterval from '@/hooks/useInterval';
import { createInterrogate, getInterrogate } from '@/services/workshop';

export type PromptInputGroupType = {
  positivePrompt: string;
  negativePrompt: string;
};

export interface PromptInputGroupRefs {
  getValues: () => PromptInputGroupType;
  setValues: (values: Partial<PromptInputGroupType>) => void;
  reversePromptLoading: boolean;
}

interface PromptInputGroupProps {
  type: 'TTI' | 'ITI';
  reversePrompt?: () => string;
}

const PromptInputGroup = forwardRef<
  PromptInputGroupRefs,
  PromptInputGroupProps
>(({ type, reversePrompt }, ref) => {
  const {
    positivePrompt: _positivePrompt,
    setPositivePrompt: _setPositivePrompt,
    negativePrompt: _negativePrompt,
    setNegativePrompt: _setNegativePrompt,
  } = useModel('workshop', (state) => ({
    positivePrompt: state.positivePrompt,
    setPositivePrompt: state.setPositivePrompt,
    negativePrompt: state.negativePrompt,
    setNegativePrompt: state.setNegativePrompt,
  }));

  const { formatMessage } = useIntl();
  const [_message, messageContextHolder] = message.useMessage();

  const [tab, setTab] = useState(`${type}-positive`);
  const [positivePrompt, setPositivePrompt] = useState(_positivePrompt);
  const [negativePrompt, setNegativePrompt] = useState(_negativePrompt);

  useEffect(() => {
    setPositivePrompt(_positivePrompt);
  }, [_positivePrompt]);
  useEffect(() => {
    setNegativePrompt(_negativePrompt);
  }, [_negativePrompt]);

  const {
    startInterval: startInterrogatePolling,
    polling: interrogatePolling,
  } = useInterval(1000, { immediate: true });

  const { loading: reversePromptLoading, runAsync: runReversePrompt } =
    useRequest(
      async (uri: string) => {
        const { id: interrogateId } = await createInterrogate(uri);
        startInterrogatePolling(async () => {
          const interrogate = await getInterrogate(interrogateId);
          if (interrogate.completed) {
            _setPositivePrompt(interrogate.text);
            setPositivePrompt(interrogate.text);
          }
          return !interrogate.completed;
        });
      },
      {
        manual: true,
      },
    );

  useImperativeHandle(ref, () => ({
    getValues: () => ({ positivePrompt, negativePrompt }),
    setValues: (values) => {
      if (values.positivePrompt) {
        setPositivePrompt(values.positivePrompt);
      }
      if (values.negativePrompt) {
        setNegativePrompt(values.negativePrompt);
      }
    },
    reversePromptLoading,
  }));

  return (
    <div className={styles.configSubItem}>
      <ThemeTabs
        plain={true}
        wrapperStyle={{ marginBottom: 6 }}
        value={tab}
        onChange={(e) => setTab(e)}
        tabs={[
          {
            label: formatMessage({ id: 'workshop.tabs.positive-prompt' }),
            key: `${type}-positive`,
            icon: <QuestionCircleOutlined />,
            iconTooltip: formatMessage({
              id: 'workshop.tabs.positive-prompt.tooltip',
            }),
          },
          {
            label: formatMessage({ id: 'workshop.tabs.negative-prompt' }),
            key: `${type}-negative`,
            icon: <QuestionCircleOutlined />,
            iconTooltip: formatMessage({
              id: 'workshop.tabs.negative-prompt.tooltip',
            }),
          },
        ]}
        extra={
          reversePrompt ? (
            <Button
              loading={reversePromptLoading || interrogatePolling}
              type={'primary'}
              shape={'round'}
              size={'small'}
              icon={<UndoOutlined />}
              onClick={() => {
                const imageUri = reversePrompt();
                if (!imageUri) {
                  _message.info(
                    formatMessage({
                      id: 'workshop.config.image-to-image.upload-tip',
                    }),
                  );
                } else {
                  runReversePrompt(imageUri);
                }
              }}
            >
              {formatMessage({
                id: 'workshop.config.image-to-image.reverse-prompt',
              })}
            </Button>
          ) : undefined
        }
      />
      <Input.TextArea
        value={tab === `${type}-positive` ? positivePrompt : negativePrompt}
        onChange={(e) => {
          (tab === `${type}-positive` ? setPositivePrompt : setNegativePrompt)(
            e.target.value,
          );
          (tab === `${type}-positive`
            ? _setPositivePrompt
            : _setNegativePrompt)(e.target.value);
        }}
        disabled={reversePromptLoading || interrogatePolling}
        rows={3}
        style={{ resize: 'none' }}
      />
      {messageContextHolder}
    </div>
  );
});

export default PromptInputGroup;
