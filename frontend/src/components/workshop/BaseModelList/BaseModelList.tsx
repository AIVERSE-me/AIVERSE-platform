import { forwardRef, useImperativeHandle } from 'react';
import { useLocalStorageState, useRequest } from 'ahooks';
import { getAIWorkBaseModels } from '@/services/workshop';
import styles from './BaseModelList.less';
import { theme, Tooltip } from 'antd';

export interface BaseModelListRef {
  setValue: (value: string) => void;
  getValue: () => void;
}

const BaseModelList = forwardRef<BaseModelListRef, any>(({}, ref) => {
  const { token: antdToken } = theme.useToken();

  const [selectedModel, setSelectedModel] = useLocalStorageState<string>(
    'workshop.config.base-model',
    {
      defaultValue: '',
    },
  );

  const { data: baseModels } = useRequest(async () => {
    const models = await getAIWorkBaseModels();
    if (!selectedModel) {
      setSelectedModel(models[0]?.baseModel ?? '');
    }
    return models;
  });

  useImperativeHandle(ref, () => ({
    setValue: (value) => {
      setSelectedModel(value);
    },
    getValue: () => selectedModel,
  }));

  return (
    <div className={styles.baseModelList}>
      {baseModels?.map((e) => (
        <Tooltip key={e.id} title={e.description}>
          <div
            className={styles.baseModelItem}
            style={{
              borderColor:
                selectedModel === e.baseModel
                  ? antdToken.colorPrimary
                  : 'transparent',
              background: antdToken.colorPrimaryBg,
            }}
            onClick={() => setSelectedModel(e.baseModel)}
          >
            <div className={styles.left}>
              <div className={styles.title}>{e.displayName}</div>
              <div className={styles.desc}>{e.description}</div>
            </div>

            <img className={styles.image} src={e.displayImage} />
          </div>
        </Tooltip>
      ))}
    </div>
  );
});

export default BaseModelList;
