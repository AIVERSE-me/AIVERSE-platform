import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { useIntl } from '@@/exports';
import styles from '../index.less';
import { WorkshopParams } from '@/pages/features/workshop/data';
import classNames from 'classnames';
import * as _ from 'lodash';
import PromptInputGroup, {
  PromptInputGroupRefs,
  PromptInputGroupType,
} from '@/components/workshop/PromptInputGroup/PromptInputGroup';
import { useLocalStorageState } from 'ahooks';

export type TextToImageInputType = {
  size: { width: number; height: number };
} & PromptInputGroupType;

export interface TextToImageInputRefs {
  getValues: () => TextToImageInputType;
  setValues: (values: Partial<TextToImageInputType>) => void;
}

const TextToImageInput = forwardRef<TextToImageInputRefs, any>(({}, ref) => {
  const { formatMessage } = useIntl();
  const promptInputGroupRef = useRef<PromptInputGroupRefs>(null);

  const [size, setSize] = useLocalStorageState<{
    width: number;
    height: number;
  }>('workshop.config.size', { defaultValue: { width: 512, height: 512 } });

  useImperativeHandle(ref, () => ({
    getValues: () => {
      const { positivePrompt = '', negativePrompt = '' } =
        promptInputGroupRef.current?.getValues() || {};
      return { positivePrompt, negativePrompt, size };
    },
    setValues: (values) => {
      if (values.positivePrompt) {
        promptInputGroupRef.current?.setValues({
          positivePrompt: values.positivePrompt,
        });
      }
      if (values.negativePrompt) {
        promptInputGroupRef.current?.setValues({
          negativePrompt: values.negativePrompt,
        });
      }
      if (values.size) {
        setSize(values.size);
      }
    },
  }));

  return (
    <>
      <PromptInputGroup ref={promptInputGroupRef} type={'TTI'} />
      <div className={styles.configSubItem}>
        <div className={styles.subTitle}>
          {formatMessage({ id: 'workshop.config.size.title' })}
        </div>
        <div className={styles.sizeCards}>
          {WorkshopParams.sizes.map((e) => (
            <div
              key={`size-${e.label}`}
              className={classNames(styles.sizeCard, {
                [styles.sizeCardSelected]: _.isEqual(size, {
                  width: e.width,
                  height: e.height,
                }),
              })}
              onClick={() =>
                setSize({
                  width: e.width,
                  height: e.height,
                })
              }
            >
              <div className={styles.sizeCardRectWrapper}>
                <div
                  className={styles.sizeCardRect}
                  style={{
                    width:
                      e.width > e.height
                        ? '100%'
                        : `${(e.width / e.height) * 100}%`,
                    paddingTop:
                      e.width > e.height
                        ? `${(e.height / e.width) * 100}%`
                        : '100%',
                  }}
                />
              </div>
              <div>{e.label}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
});

export default TextToImageInput;
