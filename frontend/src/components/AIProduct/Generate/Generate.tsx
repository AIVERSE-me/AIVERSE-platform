import styles from './Generate.less';
import { useIntl, useModel } from '@@/exports';
import {
  Button,
  Col,
  Input,
  message,
  Radio,
  Row,
  Slider,
  theme,
  Tooltip,
} from 'antd';
import {
  ArrowRightOutlined,
  CaretDownFilled,
  InfoCircleOutlined,
  LockFilled,
} from '@ant-design/icons';
import classNames from 'classnames';
import { useContext, useState } from 'react';
import { useCreation, useRequest, useUpdateEffect } from 'ahooks';
import { AIProductOutput } from '@/components/AIProduct/Generate/Output';
import useInterval from '@/hooks/useInterval';
import {
  createAIModelOutput,
  createAIProductOutput,
  deleteAIModelOutput,
  deleteAIProductOutput,
  getAIModelMetadata,
  getAIModelOutput,
  getAIModelUserPrivateModels,
  getAIProductMetadata,
  getAIProductOutput,
  getGeneratePresets,
} from '@/services/ai-product';
import { PresetList } from '@/components/AIProduct/Generate/PresetList';
import { getUserLoraPrompt } from '@/components/AIProduct/Generate/utils';
import { ThemeTabs } from '@/components/Tabs/Tabs';
import {
  PrivateModelList,
  PublicModelList,
} from '@/components/workshop/SelectModelList/SelectModelList';
import { getMarketResourcePrice } from '@/components/workshop/utils';
import { GlobalContext, GlobalContextType } from '@/layouts';
import PointButtons from '@/components/PointButtons/PointButtons';

const GenerateTypeTabs = ({
  value,
  onChange,
  labels,
}: {
  value: string;
  onChange: (value: string) => void;
  labels: string[];
}) => {
  const { token: antdToken } = theme.useToken();

  return (
    <div className={styles.tabs}>
      <div
        onClick={() => onChange('preset')}
        className={classNames(styles.tab, {
          [styles.tabActive]: value === 'preset',
        })}
        style={
          value === 'preset'
            ? {
                color: antdToken.colorPrimary,
              }
            : {}
        }
      >
        {labels[0]}
      </div>
      <div
        onClick={() => onChange('input')}
        className={classNames(styles.tab, {
          [styles.tabActive]: value === 'input',
        })}
        style={
          value === 'input'
            ? {
                color: antdToken.colorPrimary,
              }
            : {}
        }
      >
        {labels[1]}
      </div>
    </div>
  );
};

export const AIProductGenerate = ({ type }: { type: 'product' | 'model' }) => {
  const { currentUser } = useModel('user', (state) => ({
    currentUser: state.currentUser,
  }));
  const { point, refreshPoint } = useModel('point', (state) => ({
    point: state.point,
    refreshPoint: state.refreshPoint,
  }));
  const { setMenu, setCropModalOpen, useAIProduct, useAIModel, segmentTask } =
    useModel('product', (state) => ({
      setMenu: state.setMenu,
      useAIProduct: state.useAIProduct,
      useAIModel: state.useAIModel,
      setCropModalOpen: state.setCropModalOpen,
      segmentTask: state.segmentTask,
    }));
  const { token: antdToken } = theme.useToken();
  const { formatMessage } = useIntl();
  const [_message, messageContextHolder] = message.useMessage();
  const { openBuyPointModal } = useContext<GlobalContextType>(GlobalContext);

  const product = useCreation(
    () => (type === 'product' ? useAIProduct : useAIModel),
    [type, useAIProduct, useAIModel],
  );

  /**
   * advanced params
   */
  const [showAdvancedParams, setShowAdvancedParams] = useState(false);
  const [cfgScale, setCfgScale] = useState(12);
  const [steps, setSteps] = useState(25);
  const [denoisingStrength, setDenoisingStrength] = useState(0.8);
  const [configChanged, setConfigChanged] = useState(false);
  useUpdateEffect(() => {
    setConfigChanged(true);
  }, [cfgScale, steps, denoisingStrength]);

  /**
   * product
   */
  const [productGenerateType, setProductGenerateType] = useState<
    'preset' | 'input'
  >('preset');
  const [productPresetId, setProductPresetId] = useState<string>('');
  const [where, setWhere] = useState('');
  const [around, setAround] = useState('');

  /**
   * model
   */
  const [maskInverted, setMaskInverted] = useState(false);
  const [loraGenerateType, setLoraGenerateType] = useState<string>(
    type === 'model' ? 'public' : 'preset',
  );
  const [sceneGenerateType, setSceneGenerateType] = useState<
    'preset' | 'input'
  >('preset');
  const [modelPreset, setModelPreset] = useState<
    Record<
      string,
      {
        id: string;
        value: string;
        type: string;
      }
    >
  >({});
  const [publicModel, setPublicModel] = useState<API.FineTune>();
  const [privateModel, setPrivateModel] = useState<API.FineTune>();
  const [loraPrompt, setLoraPrompt] = useState('');
  const [scenePrompt, setScenePrompt] = useState('');
  const [loraWeight, setLoraWeight] = useState(1);

  const [output, setOutput] = useState<
    API.AIProductOutput | API.AIModelOutput
  >();

  const price = useCreation(
    () =>
      loraGenerateType === 'input'
        ? 0
        : loraGenerateType === 'public'
        ? publicModel
          ? getMarketResourcePrice(publicModel.marketResource!)
          : 0
        : privateModel
        ? getMarketResourcePrice(privateModel.marketResource!)
        : 0,
    [publicModel, privateModel, loraGenerateType],
  );

  const { data: productPresets } = useRequest(async () => {
    if (type === 'product') {
      const presets = (await getGeneratePresets('product')).generatePresets;
      setProductPresetId(presets[0]?.id);
      return presets;
    }
  });

  const { data: productMetadata } = useRequest(async () => {
    if (type === 'product') {
      return await getAIProductMetadata();
    }
  });

  const { data: modelMetadata } = useRequest(async () => {
    if (type === 'model') {
      const metadata = await getAIModelMetadata();
      const usePreset: any = {};
      metadata.options.forEach((e) => {
        if (e.options[0]) {
          usePreset[e.code] = {
            type: 'preset',
            value: e.options[0].value,
            id: e.options[0].value,
          };
        }
      });
      setModelPreset(usePreset);
      return metadata;
    }
  });

  const { data: userLora = [] } = useRequest(
    async () => {
      if (!currentUser) return [];
      if (type === 'model') {
        try {
          return await getAIModelUserPrivateModels();
        } catch (e) {
          console.log(e);
          _message.error(
            formatMessage({
              id: 'select-fine-tune-model-modal.get-fine-tune-failed',
            }),
          );
        }
      }
    },
    {
      refreshDeps: [currentUser],
    },
  );

  const modelOptions = useCreation(() => {
    if (!modelMetadata) {
      return {};
    }
    return {
      scene:
        modelMetadata.options
          .find((e) => e.code === 'scene')
          ?.options.map((e) => ({
            id: e.value,
            value: e.value,
            image: e.image,
            type: 'preset',
          })) ?? [],
    };
  }, [modelMetadata, userLora]);

  const outputPolling = useCreation(
    () =>
      output
        ? output.status === 'CREATED' || output.status === 'STARTED'
        : false,
    [output],
  );

  const { startInterval: startOutputPolling } = useInterval(2000, {
    immediate: true,
  });

  const { runAsync: runCreate, loading: createLoading } = useRequest(
    async () => {
      if (
        (type === 'product' && !productMetadata) ||
        (type === 'model' && !modelMetadata)
      )
        return;

      if (price > point) {
        _message.info(formatMessage({ id: 'recharge-tip' }));
        openBuyPointModal();
        return;
      }

      try {
        let output: API.AIProductOutput | API.AIModelOutput;
        if (type === 'product') {
          const params = configChanged
            ? {
                cfg_scale: cfgScale,
                steps: steps,
                denoising_strength: denoisingStrength,
              }
            : {};
          const { createAiProductOutput } = await createAIProductOutput({
            customParams:
              productGenerateType === 'preset'
                ? params
                : {
                    ...params,
                    prompt: `它在${where}, 周围有${around}`,
                  },
            productId: useAIProduct.id,
            presetId:
              productGenerateType === 'preset'
                ? productPresetId
                : productMetadata!.customUsePresetId,
          });
          output = createAiProductOutput;
        } else {
          const params = configChanged
            ? {
                cfg_scale: cfgScale,
                steps: steps,
                denoising_strength: denoisingStrength,
              }
            : {};
          if (
            (loraGenerateType === 'public' && !publicModel) ||
            (loraGenerateType === 'private' && !privateModel)
          ) {
            _message.info(
              formatMessage({ id: 'ai-product.generate.select-model-tip' }),
            );
            return;
          }
          const _humanPrompt =
            loraGenerateType === 'input'
              ? loraPrompt
              : loraGenerateType === 'public'
              ? getUserLoraPrompt(publicModel!)
              : getUserLoraPrompt(privateModel!);
          const _scenePrompt =
            sceneGenerateType === 'preset'
              ? modelPreset.scene?.value
              : scenePrompt;
          const { createAiModelOutput } = await createAIModelOutput({
            customParams: {
              ...params,
              prompt: maskInverted
                ? `${_humanPrompt}`
                : `${_humanPrompt}, ${_scenePrompt}`,
            },
            modelId: useAIModel.id,
            presetId: maskInverted
              ? modelMetadata!.maskInvertedUsePresetId
              : modelMetadata!.usePresetId,
          });
          output = createAiModelOutput;
        }
        setOutput(output);
        startOutputPolling(async () => {
          try {
            let _output: API.AIProductOutput | API.AIModelOutput;
            if (type === 'product') {
              const { aiProductOutput } = await getAIProductOutput(output.id);
              _output = aiProductOutput;
            } else {
              const { aiModelOutput } = await getAIModelOutput(output.id);
              _output = aiModelOutput;
            }
            setOutput(_output);
            if (_output.status === 'FINISHED' || _output.status === 'ERROR') {
              return false;
            }
          } catch (e) {}
          return true;
        });
        refreshPoint();
      } catch (e) {
        console.log(e);
        _message.error(
          formatMessage({ id: 'ai-product.generate.failed-to-create-task' }),
        );
      }
    },
    {
      manual: true,
    },
  );

  const { runAsync: runDeleteOutput } = useRequest(
    async () => {
      if (!output) return;
      const func =
        type === 'product' ? deleteAIProductOutput : deleteAIModelOutput;
      try {
        await func(output.id);
        setOutput(undefined);
        _message.success(
          formatMessage({
            id: 'ai-product.generate.output-action.delete.done',
          }),
        );
      } catch (e) {
        console.log(e);
      }
    },
    { manual: true },
  );

  return (
    <div className={styles.container}>
      <div className={styles.input}>
        <PointButtons style={{ marginTop: 0, marginBottom: 12 }} />
        <div className={styles.segment}>
          {product ? (
            <>
              <img src={product.maskedOriImgUrl} />
              <Button
                className={styles.reCropButton}
                type={'primary'}
                shape={'round'}
                size={'small'}
                disabled={!segmentTask || outputPolling || createLoading}
                onClick={() => {
                  setCropModalOpen(true);
                }}
              >
                {formatMessage({ id: 'ai-product.generate.segment.re-crop' })}
              </Button>
            </>
          ) : (
            <div
              className={styles.noSegmentTip}
              style={{ color: antdToken.colorPrimary }}
            >
              <div>
                {formatMessage({
                  id: 'ai-product.generate.no-segment-tip.title',
                })}
              </div>
              <Button
                type={'primary'}
                shape={'round'}
                size={'small'}
                onClick={() => setMenu('upload')}
              >
                {formatMessage({
                  id: 'ai-product.generate.no-segment-tip.button.upload',
                })}
              </Button>
              <Button
                type={'primary'}
                ghost
                shape={'round'}
                size={'small'}
                onClick={() => setMenu('history')}
              >
                {formatMessage({
                  id: 'ai-product.generate.no-segment-tip.button.history',
                })}
              </Button>
            </div>
          )}
        </div>
        <div className={styles.parameter}>
          <Button
            type={'primary'}
            shape={'round'}
            block
            loading={createLoading || outputPolling}
            onClick={() => {
              if (!product) {
                _message.info(
                  formatMessage({
                    id: 'ai-product.generate.no-segment-tip.title',
                  }),
                );
                return;
              }
              if (productGenerateType === 'input') {
                if (
                  (type === 'product' && (!where || !around)) ||
                  (type === 'model' && !loraPrompt)
                ) {
                  _message.info(
                    formatMessage({
                      id: 'ai-product.generate.type.input.placeholder',
                    }),
                  );
                  return;
                }
              }
              runCreate();
            }}
          >
            {outputPolling
              ? formatMessage(
                  { id: 'ai-product.generate.button.generate-polling' },
                  {
                    progress: Math.max(5, output?.progress || 0),
                  },
                )
              : createLoading
              ? formatMessage({
                  id: 'ai-product.generate.button.generate-loading',
                })
              : price > 0
              ? formatMessage(
                  {
                    id: 'ai-product.generate.button.generate-price',
                  },
                  { price },
                )
              : formatMessage({
                  id: 'ai-product.generate.button.generate',
                })}
          </Button>
          <div className={styles.parameterSection}>
            <Tooltip
              placement={'topLeft'}
              title={formatMessage({
                id: 'ai-product.generate.advanced-params.locked-tip',
              })}
            >
              <div
                className={classNames(styles.rowBetween, styles.clickable)}
                style={{ marginBottom: 12 }}
                onClick={() => setShowAdvancedParams((state) => !state)}
              >
                <div className={styles.title}>
                  <LockFilled style={{ marginRight: 4 }} />
                  {formatMessage({
                    id: 'ai-product.generate.advanced-params.title',
                  })}
                </div>
                <CaretDownFilled
                  style={{
                    transform: `rotate(${showAdvancedParams ? 0 : 90}deg)`,
                  }}
                  className={styles.collapsedButton}
                />
              </div>
            </Tooltip>
            {showAdvancedParams && (
              <>
                <div className={styles.advancedParamRow}>
                  <div className={styles.title}>
                    <Tooltip
                      placement={'topLeft'}
                      title={formatMessage({
                        id: 'ai-product.generate.advanced-params.cfg-scale.tip',
                      })}
                    >
                      <InfoCircleOutlined />{' '}
                      {formatMessage({
                        id: 'ai-product.generate.advanced-params.cfg-scale',
                      })}
                    </Tooltip>
                  </div>
                  <Slider
                    style={{ width: 150 }}
                    min={7}
                    max={16}
                    step={0.5}
                    value={cfgScale}
                    onChange={(e) => setCfgScale(e)}
                  />
                </div>
                <div className={styles.advancedParamRow}>
                  <div className={styles.title}>
                    <Tooltip
                      placement={'topLeft'}
                      title={formatMessage({
                        id: 'ai-product.generate.advanced-params.steps.tip',
                      })}
                    >
                      <InfoCircleOutlined />{' '}
                      {formatMessage({
                        id: 'ai-product.generate.advanced-params.steps',
                      })}
                    </Tooltip>
                  </div>
                  <Slider
                    style={{ width: 150 }}
                    min={25}
                    max={40}
                    step={1}
                    value={steps}
                    onChange={(e) => setSteps(e)}
                  />
                </div>
                <div className={styles.advancedParamRow}>
                  <div className={styles.title}>
                    <Tooltip
                      placement={'topLeft'}
                      title={formatMessage({
                        id: 'ai-product.generate.advanced-params.denoising-strength.tip',
                      })}
                    >
                      <InfoCircleOutlined />{' '}
                      {formatMessage({
                        id: 'ai-product.generate.advanced-params.denoising-strength',
                      })}
                    </Tooltip>
                  </div>
                  <div className={styles.denoisingStrength}>
                    <Slider
                      style={{ width: 150 }}
                      min={0}
                      max={1}
                      step={0.05}
                      value={denoisingStrength}
                      onChange={(e) => setDenoisingStrength(e)}
                    />
                    <div className={styles.denoisingStrengthMark}>
                      <div className={styles.markLeft}>
                        {formatMessage({
                          id: 'activity-ant.submit-modal.original-image',
                        })}
                      </div>
                      <ArrowRightOutlined />
                      <div className={styles.markRight}>
                        {formatMessage({
                          id: 'activity-ant.submit-modal.complete-refactoring',
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          {type === 'model' && (
            <div className={styles.parameterSection}>
              <div className={styles.title} style={{ marginBottom: 6 }}>
                {formatMessage({ id: 'ai-product.generate.redraw-method' })}
              </div>
              <Radio.Group
                value={maskInverted ? 'mask-inverted' : 'mask'}
                onChange={(e) =>
                  setMaskInverted(e.target.value === 'mask-inverted')
                }
              >
                <Radio value={'mask'}>
                  {formatMessage({
                    id: 'ai-product.generate.redraw-method.mask',
                  })}
                </Radio>
                <Radio value={'mask-inverted'}>
                  {formatMessage({
                    id: 'ai-product.generate.redraw-method.mask-inverted',
                  })}
                </Radio>
              </Radio.Group>
            </div>
          )}
          {type === 'model' && modelPreset.human?.type === 'user' && (
            <div className={styles.parameterSection}>
              <Tooltip
                placement={'topLeft'}
                title={formatMessage({
                  id: 'ai-product.generate.user-lora-weight.tip',
                })}
              >
                <div className={styles.title} style={{ marginBottom: 6 }}>
                  <InfoCircleOutlined />{' '}
                  {formatMessage({
                    id: 'ai-product.generate.user-lora-weight',
                  })}
                </div>
              </Tooltip>
              <Slider
                min={0.5}
                max={1.5}
                step={0.1}
                value={loraWeight}
                onChange={(e) => setLoraWeight(e)}
              />
            </div>
          )}
          <div className={styles.parameterSection}>
            {type === 'product' && (
              <>
                <GenerateTypeTabs
                  value={productGenerateType}
                  onChange={(e) => setProductGenerateType(e)}
                  labels={[
                    formatMessage({ id: 'ai-product.generate.type.preset' }),
                    formatMessage({ id: 'ai-product.generate.type.input' }),
                  ]}
                />
                {productGenerateType === 'preset' ? (
                  <Row gutter={[8, 8]}>
                    {productPresets?.map((p) => (
                      <Col key={p.id} span={12}>
                        <img
                          onClick={() => setProductPresetId(p.id)}
                          className={styles.presetImage}
                          style={{
                            borderColor:
                              productPresetId === p.id
                                ? antdToken.colorPrimary
                                : 'transparent',
                          }}
                          src={p.displayImgUrl}
                        />
                      </Col>
                    ))}
                  </Row>
                ) : (
                  <>
                    <div className={styles.customInput}>
                      <div className={styles.customInputTitle}>
                        {formatMessage({
                          id: 'ai-product.generate.type-good.input-0',
                        })}
                      </div>
                      <Input.TextArea
                        disabled={createLoading || outputPolling}
                        rows={2}
                        style={{ resize: 'none' }}
                        maxLength={100}
                        placeholder={formatMessage({
                          id: 'ai-product.generate.type-good.input-0.placeholder',
                        })}
                        value={where}
                        onChange={(e) => setWhere(e.target.value)}
                      />
                    </div>
                    <div className={styles.customInput}>
                      <div className={styles.customInputTitle}>
                        {formatMessage({
                          id: 'ai-product.generate.type-good.input-1',
                        })}
                      </div>
                      <Input.TextArea
                        disabled={createLoading || outputPolling}
                        rows={2}
                        style={{ resize: 'none' }}
                        maxLength={100}
                        placeholder={formatMessage({
                          id: 'ai-product.generate.type-good.input-1.placeholder',
                        })}
                        value={around}
                        onChange={(e) => setAround(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </>
            )}
            {type === 'model' && (
              <>
                <ThemeTabs
                  wrapperStyle={{ marginBottom: 6 }}
                  value={loraGenerateType}
                  onChange={(e) => setLoraGenerateType(e)}
                  tabs={[
                    {
                      key: 'public',
                      label: formatMessage({
                        id: 'ai-product.generate.type-lora.public',
                      }),
                    },
                    {
                      key: 'private',
                      label: formatMessage({
                        id: 'ai-product.generate.type-lora.private',
                      }),
                    },
                    {
                      key: 'input',
                      label: formatMessage({
                        id: 'ai-product.generate.type-lora.input',
                      }),
                    },
                  ]}
                />
                {loraGenerateType === 'public' ? (
                  <PublicModelList
                    selectedModel={publicModel?.uniqueToken}
                    onSelect={(uniqueToken, fineTune) => {
                      setPublicModel(fineTune);
                    }}
                    type={'PERSON'}
                    pageSize={6}
                  />
                ) : loraGenerateType === 'private' ? (
                  <PrivateModelList
                    selectedModel={privateModel?.uniqueToken}
                    onSelect={(uniqueToken, fineTune) => {
                      setPrivateModel(fineTune);
                    }}
                    type={'PERSON'}
                    pageSize={6}
                  />
                ) : (
                  <div className={styles.customInput}>
                    <Input.TextArea
                      disabled={createLoading || outputPolling}
                      rows={3}
                      style={{ resize: 'none' }}
                      maxLength={100}
                      placeholder={formatMessage({
                        id: 'ai-product.generate.type.input-lora.placeholder',
                      })}
                      value={loraPrompt}
                      onChange={(e) => setLoraPrompt(e.target.value)}
                    />
                  </div>
                )}
                {!maskInverted && (
                  <>
                    <GenerateTypeTabs
                      value={sceneGenerateType}
                      onChange={(e) => setSceneGenerateType(e)}
                      labels={[
                        formatMessage({
                          id: 'ai-product.generate.type-scene.preset',
                        }),
                        formatMessage({
                          id: 'ai-product.generate.type-scene.input',
                        }),
                      ]}
                    />
                    {sceneGenerateType === 'preset' && modelOptions.scene ? (
                      <PresetList
                        data={modelOptions.scene}
                        value={modelPreset.scene?.id}
                        onChange={(e) => {
                          setModelPreset((state) => ({
                            ...state,
                            scene: e,
                          }));
                        }}
                      />
                    ) : (
                      <div className={styles.customInput}>
                        <Input.TextArea
                          disabled={createLoading || outputPolling}
                          rows={3}
                          style={{ resize: 'none' }}
                          maxLength={100}
                          placeholder={formatMessage({
                            id: 'ai-product.generate.type.input-scene.placeholder',
                          })}
                          value={scenePrompt}
                          onChange={(e) => setScenePrompt(e.target.value)}
                        />
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <AIProductOutput
        outputType={type}
        output={output}
        onDelete={runDeleteOutput}
      />
      {messageContextHolder}
    </div>
  );
};
