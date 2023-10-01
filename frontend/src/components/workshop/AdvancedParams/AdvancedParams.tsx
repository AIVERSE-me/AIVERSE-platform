import { useCreation, useLocalStorageState, useMemoizedFn } from 'ahooks';
import { useIntl, useModel } from '@@/exports';
import {
  Badge,
  Button,
  Card,
  Col,
  InputNumber,
  message,
  Row,
  Select,
  Slider,
  Space,
  Switch,
  Tooltip,
  Upload,
  UploadFile,
} from 'antd';
import {
  PlusOutlined,
  QuestionCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import styles from '../index.less';
import { WorkshopParams } from '@/pages/features/workshop/data';
import React, {
  forwardRef,
  useContext,
  useImperativeHandle,
  useState,
} from 'react';
import { GlobalContext, GlobalContextType } from '@/layouts';

const AdvancedParamsItem = ({
  label,
  children,
  style,
  tooltip = true,
}: {
  label?: string;
  children?: any;
  style?: React.CSSProperties;
  tooltip?: boolean;
}) => {
  const { formatMessage } = useIntl();

  return (
    <div className={styles.advancedParamItem} style={style}>
      {label && (
        <Space size={4}>
          <div>{formatMessage({ id: label })}</div>
          {tooltip && (
            <Tooltip title={formatMessage({ id: `${label}.tip` })}>
              <QuestionCircleOutlined />
            </Tooltip>
          )}
        </Space>
      )}
      {children}
    </div>
  );
};

type ControlNetValueType = API.ControlNetArgInput & {
  enabled: boolean;
};

const ControlNetItem = ({
  preprocessors,
  value,
  onChange,
}: {
  preprocessors: string[];
  value: ControlNetValueType;
  onChange: (values: Partial<ControlNetValueType>) => void;
}) => {
  const { checkSignedIn } = useContext<GlobalContextType>(GlobalContext);
  const { token } = useModel('user', (state) => ({
    token: state.token,
  }));
  const { formatMessage } = useIntl();
  const [_message, messageContextHolder] = message.useMessage();

  const { enabled, module, weight, input_image } = value;

  const [fileList, setFileList] = useState<
    (UploadFile & { assetId?: string })[]
  >([]);

  const uploading = useCreation(
    () => fileList[fileList.length - 1]?.status === 'uploading',
    [fileList],
  );

  return (
    <>
      <AdvancedParamsItem
        tooltip={false}
        label={'workshop.config.advance.control-net.enabled'}
      >
        <Switch checked={enabled} onChange={(e) => onChange({ enabled: e })} />
      </AdvancedParamsItem>
      <AdvancedParamsItem
        tooltip={false}
        label={'workshop.config.advance.control-net.preprocessor'}
      >
        <Select
          style={{ width: 200 }}
          options={preprocessors.map((e) => ({
            value: e,
            label: e,
          }))}
          value={module}
          onChange={(e) => {
            onChange({ module: e });
          }}
        />
      </AdvancedParamsItem>
      <AdvancedParamsItem
        tooltip={false}
        label={'workshop.config.advance.control-net.weight'}
      >
        <Slider
          style={{ minWidth: 200, margin: '11px 5px' }}
          min={0}
          max={2}
          step={0.1}
          value={weight}
          onChange={(e) =>
            onChange({
              weight: e,
            })
          }
          marks={{
            0: 0,
            2: 2,
          }}
        />
      </AdvancedParamsItem>
      <AdvancedParamsItem style={{ marginBottom: 0 }}>
        <div className={styles.controlNetPreview}>
          <Upload
            action="/api/ai-work-images/used-images"
            headers={{ authorization: `Bearer ${token}` }}
            listType="picture-card"
            name={'files'}
            fileList={fileList}
            showUploadList={false}
            accept={'image/*'}
            style={{ marginBottom: 0 }}
            className={`control-net-upload`}
            disabled={uploading}
            onChange={({ fileList }) => {
              setFileList(fileList);
              if (fileList.length > 0) {
                const lastFile = fileList[fileList.length - 1];
                if (lastFile.status === 'done' && lastFile.response[0]?.url) {
                  onChange({ input_image: lastFile.response[0].url });
                }
              }
            }}
          >
            {input_image ? (
              <div
                className={styles.uploadImageWrapper}
                style={{ width: 269, height: 269 }}
              >
                <img src={input_image} className={styles.uploadImage} />
                <div
                  className={styles.uploadText}
                  onClick={(e) => {
                    if (!checkSignedIn()) {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                  }}
                >
                  {formatMessage({
                    id: 'workshop.config.image-to-image.re-upload',
                  })}
                </div>
              </div>
            ) : (
              <div
                className={styles.uploadContent}
                onClick={(e) => {
                  if (!checkSignedIn()) {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
              >
                <PlusOutlined style={{ fontSize: 20 }} />
                <div>
                  {formatMessage({
                    id: 'workshop.config.advance.control-net.upload',
                  })}
                </div>
              </div>
            )}
          </Upload>
          <div className={styles.previewContent}>
            <Button
              type={'primary'}
              shape={'round'}
              onClick={() => {
                if (!input_image) {
                  _message.info(
                    formatMessage({
                      id: 'workshop.config.advance.control-net.upload-tip',
                    }),
                  );
                }
              }}
            >
              {formatMessage({
                id: 'workshop.config.advance.control-net.preview',
              })}
            </Button>
          </div>
        </div>
        {messageContextHolder}
      </AdvancedParamsItem>
    </>
  );
};

type AdvancedParamsType = {
  sampling: string;
  steps: number;
  seed: number;
  promptWeight: number;
  facialRepair: boolean;
  denoisingStrength: number;
  controlNets?: API.ControlNetArgInput[];
};

export type AdvancedParamsRefs = {
  getValues: () => AdvancedParamsType | undefined;
  setValues: (values: Partial<AdvancedParamsType>) => void;
};

type AdvancedParamsProps = {
  type: 'ITI' | 'TTI';
};

const AdvancedParams = forwardRef<AdvancedParamsRefs, AdvancedParamsProps>(
  ({ type }, ref) => {
    const { formatMessage } = useIntl();
    const [_message, messageContextHolder] = message.useMessage();

    const [sampling, setSampling] = useLocalStorageState<string>(
      'workshop.config.advance.sampling',
      {
        defaultValue: WorkshopParams.sampling[0],
      },
    );
    const [steps, setSteps] = useLocalStorageState<number>(
      'workshop.config.advance.steps',
      {
        defaultValue: 25,
      },
    );
    const [seed, setSeed] = useState(-1);
    const [promptWeight, setPromptWeight] = useLocalStorageState<number>(
      'workshop.config.advance.prompt-weight',
      {
        defaultValue: 10,
      },
    );
    const [facialRepair, setFacialRepair] = useLocalStorageState<boolean>(
      'workshop.config.advance.facial-repair',
      {
        defaultValue: false,
      },
    );
    const [denoisingStrength, setDenoisingStrength] =
      useLocalStorageState<number>(
        'workshop.config.advance.denoising-strength',
        {
          defaultValue: 0.8,
        },
      );
    const [useControlNet, setUseControlNet] = useLocalStorageState<boolean>(
      'workshop.config.advance.use-control-net',
      {
        defaultValue: false,
      },
    );

    const [controlNetIndex, setControlNetIndex] = useState(0);

    const [controlNetValues, setControlNetValues] = useState<
      ControlNetValueType[]
    >(
      WorkshopParams.controlNet.map((e) => ({
        model: e.model,
        enabled: false,
        module: e.preprocessors[0],
        weight: 1,
        input_image: '',
      })),
    );

    const controlNetValue = useCreation(
      () => controlNetValues[controlNetIndex],
      [controlNetIndex, controlNetValues],
    );

    const setControlNetValue = useMemoizedFn(
      (values: Partial<ControlNetValueType>) => {
        const _controlNetValues = [...controlNetValues];
        _controlNetValues[controlNetIndex] = {
          ..._controlNetValues[controlNetIndex],
          ...values,
        };
        setControlNetValues(_controlNetValues);
      },
    );

    useImperativeHandle(ref, () => ({
      getValues: () => {
        if (useControlNet) {
          for (const controlNetValue of controlNetValues) {
            if (controlNetValue.enabled && !controlNetValue.input_image) {
              _message.warning(
                formatMessage(
                  { id: 'workshop.config.advance.control-net.upload-message' },
                  {
                    controlNet: formatMessage({
                      id: `workshop.config.advance.control-net.type.${
                        WorkshopParams.controlNet.find(
                          (e) => e.model === controlNetValue.model,
                        )?.type
                      }`,
                    }),
                  },
                ),
              );
              return undefined;
            }
          }
        }
        return {
          sampling,
          steps,
          seed,
          promptWeight,
          facialRepair,
          denoisingStrength,
          controlNets: useControlNet
            ? controlNetValues.filter((e) => e.enabled)
            : undefined,
        };
      },
      setValues: (values) => {
        const {
          sampling,
          steps,
          seed,
          promptWeight,
          facialRepair,
          denoisingStrength,
          controlNets,
        } = values;
        if (sampling) {
          setSampling(sampling);
        }
        if (steps) {
          setSteps(steps);
        }
        if (seed) {
          setSeed(seed);
        }
        if (promptWeight) {
          setPromptWeight(promptWeight);
        }
        setFacialRepair(!!facialRepair);
        if (denoisingStrength) {
          setDenoisingStrength(denoisingStrength);
        }
        if (controlNets) {
          setControlNetValues(
            WorkshopParams.controlNet.map((c) => {
              const controlNet = controlNets.find((e) => e.model === c.model);
              if (controlNet) {
                return {
                  ...controlNet,
                  enabled: true,
                };
              } else {
                return {
                  model: c.model,
                  enabled: false,
                  module: c.preprocessors[0],
                  weight: 1,
                  input_image: '',
                };
              }
            }),
          );
        }
      },
    }));

    return (
      <>
        <Row className={styles.configSubItem} gutter={24}>
          <Col key={'sampling'} span={12}>
            <AdvancedParamsItem label={'workshop.config.advance.sampling'}>
              <Select
                style={{ minWidth: 120, maxWidth: 120 }}
                options={WorkshopParams.sampling.map((e) => ({
                  value: e,
                  label: e,
                }))}
                value={sampling}
                onChange={(e) => setSampling(e)}
              />
            </AdvancedParamsItem>
          </Col>
          <Col key={'steps'} span={12}>
            <AdvancedParamsItem label={'workshop.config.advance.steps'}>
              <Slider
                style={{ minWidth: 120, margin: '11px 5px' }}
                value={steps}
                onChange={(e) => setSteps(e)}
                min={25}
                max={40}
                step={1}
                marks={{
                  25: 25,
                  40: 40,
                }}
              />
            </AdvancedParamsItem>
          </Col>
          <Col key={'seed'} span={12}>
            <AdvancedParamsItem label={'workshop.config.advance.seed'}>
              <Space size={6} style={{ width: 120 }}>
                <InputNumber
                  style={{ width: '100%' }}
                  value={seed}
                  step={1}
                  parser={(e) => {
                    if (!e) return -1;
                    let num = parseInt(e);
                    if (isNaN(num)) return -1;
                    return num;
                  }}
                  onChange={(e) => setSeed(e ?? -1)}
                  min={-1}
                />
                <SyncOutlined
                  style={{ cursor: 'pointer' }}
                  onClick={() =>
                    setSeed(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER))
                  }
                />
              </Space>
            </AdvancedParamsItem>
          </Col>
          <Col key={'prompt-weight'} span={12}>
            <AdvancedParamsItem label={'workshop.config.advance.prompt-weight'}>
              <Slider
                style={{ minWidth: 120, margin: '11px 5px' }}
                min={7}
                max={16}
                step={1}
                marks={{
                  7: 7,
                  16: 16,
                }}
                value={promptWeight}
                onChange={(e) => setPromptWeight(e)}
              />
            </AdvancedParamsItem>
          </Col>
          <Col key={'facial-repair'} span={12}>
            <AdvancedParamsItem label={'workshop.config.advance.facial-repair'}>
              <Switch
                checked={facialRepair}
                onChange={(e) => setFacialRepair(e)}
              />
            </AdvancedParamsItem>
          </Col>
          {type === 'ITI' && (
            <Col key={'denoising-strength'} span={12}>
              <AdvancedParamsItem
                label={'workshop.config.advance.denoising-strength'}
              >
                <Slider
                  style={{ minWidth: 120, margin: '11px 5px' }}
                  min={0}
                  max={1}
                  step={0.05}
                  value={denoisingStrength}
                  onChange={(e) => setDenoisingStrength(e)}
                  marks={{
                    0: formatMessage({
                      id: 'activity-ant.submit-modal.original-image',
                    }),
                    1: (
                      <div style={{ whiteSpace: 'nowrap' }}>
                        {formatMessage({
                          id: 'activity-ant.submit-modal.complete-refactoring',
                        })}
                      </div>
                    ),
                  }}
                />
              </AdvancedParamsItem>
            </Col>
          )}
        </Row>
        <div className={styles.configSubItem}>
          <AdvancedParamsItem
            label={'workshop.config.advance.use-control-net'}
            style={{ marginBottom: 6 }}
          >
            <Switch
              checked={useControlNet}
              onChange={(e) => setUseControlNet(e)}
            />
          </AdvancedParamsItem>
          {useControlNet && (
            <Card
              size={'small'}
              tabList={WorkshopParams.controlNet.map((e, index) => ({
                key: e.type,
                label: (
                  <Badge
                    status={
                      controlNetValues[index].enabled ? 'success' : 'default'
                    }
                    text={formatMessage({
                      id: `workshop.config.advance.control-net.type.${e.type}`,
                    })}
                  />
                ),
              }))}
              onTabChange={(e) =>
                setControlNetIndex(
                  WorkshopParams.controlNet.findIndex((c) => c.type === e),
                )
              }
              className={styles.controlNetCard}
            >
              <div key={controlNetValue.model}>
                <ControlNetItem
                  preprocessors={
                    WorkshopParams.controlNet[controlNetIndex].preprocessors
                  }
                  value={controlNetValue}
                  onChange={(e) => setControlNetValue(e)}
                />
              </div>
            </Card>
          )}
        </div>
        {messageContextHolder}
      </>
    );
  },
);

export default AdvancedParams;
