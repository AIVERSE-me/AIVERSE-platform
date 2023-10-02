import styles from './index.less';
import { Helmet, useIntl, useLocation, useModel } from '@@/exports';
import {
  Badge,
  Col,
  ConfigProvider,
  message,
  notification,
  Row,
  Space,
  Switch,
} from 'antd';
import SafeArea from '@/components/SafeArea/SafeArea';
import React, { useContext, useEffect, useRef, useState } from 'react';
import Tabs, { ThemeTabs } from '@/components/Tabs/Tabs';
import PointButtons from '@/components/PointButtons/PointButtons';
import { GlobalContext, GlobalContextType } from '@/layouts';
import {
  useAsyncEffect,
  useLocalStorageState,
  useMemoizedFn,
  useRequest,
} from 'ahooks';
import SelectModelList, {
  SelectModelListRefs,
} from '@/components/workshop/SelectModelList/SelectModelList';
import TextToImageInput, {
  TextToImageInputRefs,
} from '@/components/workshop/TextToImageInput/TextToImageInput';
import ImageToImageInput, {
  ImageToImageInputRefs,
} from '@/components/workshop/ImageToImageInput/ImageToImageInput';
import AdvancedParams, {
  AdvancedParamsRefs,
} from '@/components/workshop/AdvancedParams/AdvancedParams';
import { CheckCircleFilled, SwapRightOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import GenerateButton from '@/components/GenerateButton/GenerateButton';
import GenericOutputPanel, {
  GenericOutputPanelRefs,
} from '@/components/GenericOutput/GenericOutputPanel';
import CreateTemplateModal from '@/components/workshop/Modal/CreateTemplateModal';
import {
  createAiWorkImage,
  createAiWorkImageHr,
  deleteAiWorkImage,
  getAIWorkImage,
  getAIWorkImages,
} from '@/services/workshop';
import BaseModelList, {
  BaseModelListRef,
} from '@/components/workshop/BaseModelList/BaseModelList';
import { getGeneratePresetDetailed } from '@/services/ai-product';
import {
  WORKSHOP_DEFAULT_NEGATIVE_PROMPT,
  WorkshopParams,
} from '@/pages/features/workshop/data';
const Index = () => {
  const { point, refreshPoint } = useModel('point', (state) => ({
    point: state.point,
    refreshPoint: state.refreshPoint,
  }));
  const {
    personModel,
    styleModels,
    validatePrompt,
    clearPersonModel,
    clearStyleModels,
    price,
  } = useModel('workshop', (state) => ({
    personModel: state.personModel,
    styleModels: state.styleModels,
    validatePrompt: state.validatePrompt,
    clearPersonModel: state.clearPersonModel,
    clearStyleModels: state.clearStyleModels,
    price: state.price,
  }));

  const { state } = useLocation();
  const { formatMessage } = useIntl();
  const [_message, messageContextHolder] = message.useMessage();
  const [_notification, notificationContextHolder] =
      notification.useNotification();
  const { checkSignedIn, openBuyPointModal } =
      useContext<GlobalContextType>(GlobalContext);
  const baseModelRef = useRef<BaseModelListRef>(null);
  const selectPersonModelRef = useRef<SelectModelListRefs>(null);
  const selectStyleModelRef = useRef<SelectModelListRefs>(null);
  const textToImageRef = useRef<TextToImageInputRefs>(null);
  const imageToImageRef = useRef<ImageToImageInputRefs>(null);
  const advancedParamsRef = useRef<AdvancedParamsRefs>(null);
  const outputPanelRef = useRef<GenericOutputPanelRefs>(null);

  const [createTemplateImage, setCreateTemplateImage] =
      useState<API.AiWorkImage>();

  const [useFigureModel, setUseFigureModel] = useLocalStorageState<boolean>(
      'workshop.config.use-figure-model',
      {
        defaultValue: true,
      },
  );
  const [useStyleModel, setUseStyleModel] = useLocalStorageState<boolean>(
      'workshop.config.use-style-model',
      {
        defaultValue: true,
      },
  );
  const [useAdvance, setUseAdvance] = useLocalStorageState<boolean>(
      'workshop.config.use-advance',
      {
        defaultValue: true,
      },
  );
  const [generateType, setGenerateType] = useState<'TTI' | 'ITI'>('TTI');

  useEffect(() => {
    if (!!personModel) {
      setUseFigureModel(true);
    }
  }, [personModel]);

  useEffect(() => {
    if (styleModels.length > 0) {
      setUseStyleModel(true);
    }
  }, [styleModels]);

  const handleRepaint = useMemoizedFn(
      (params: API.ImageGenerateParams, image?: string) => {
        setGenerateType('ITI');
        setTimeout(() => {
          imageToImageRef.current?.setValues({
            baseImageUri:
                image || (params as API.ImageGenerateParamsImg2Img).init_images[0],
            positivePrompt: params.prompt || params.img2imgPrompt,
            negativePrompt: params.negative_prompt,
          });
        }, 100);
        setUseAdvance(true);
        advancedParamsRef.current?.setValues({
          sampling: params.sampler_name,
          steps: params.steps,
          seed: params.seed,
          promptWeight: params.cfg_scale,
          facialRepair: !!params.alwayson_scripts?.ADetailer,
          denoisingStrength: (params as any).denoising_strength,
          controlNets: params.alwayson_scripts?.controlnet?.args || [],
        });
      },
  );

  useAsyncEffect(async () => {
    const { templateId } = (state as any) ?? {};
    if (templateId) {
      const preset = await getGeneratePresetDetailed(templateId);
      handleRepaint(preset.params);
    }
  }, [state]);

  const { loading: createLoading, runAsync: runCreate } = useRequest(
      async (params?: API.ImageGenerateParamsInput) => {
        if (params) {
          try {
            await createAiWorkImage(params);
            outputPanelRef.current?.refreshOutputs();
          } catch (e) {
            _message.error(
                formatMessage({ id: 'workshop.generate.failed-to-create-task' }),
            );
          }
          return;
        }

        const baseModel = baseModelRef.current?.getValue();
        if (!baseModel) return;
        if (price > point) {
          _message.info(formatMessage({ id: 'recharge-tip' }));
          openBuyPointModal();
          return;
        }

        const promptValidate = await validatePrompt();
        if (!promptValidate) {
          _message.warning(
              formatMessage({ id: 'workshop.tabs.positive-prompt.invalid' }),
          );
          return;
        }

        try {
          if (generateType === 'TTI' && textToImageRef.current) {
            const {
              positivePrompt,
              negativePrompt,
              size: { width, height },
            } = textToImageRef.current.getValues();
            if (useAdvance && advancedParamsRef.current) {
              const advancedParams = advancedParamsRef.current.getValues();
              if (!advancedParams) return;
              const {
                sampling,
                steps,
                seed,
                promptWeight,
                facialRepair,
                controlNets,
              } = advancedParams;
              await createAiWorkImage({
                txt2img: {
                  type: 'txt2img',
                  base_model: baseModel,
                  prompt: positivePrompt,
                  negative_prompt: `${WORKSHOP_DEFAULT_NEGATIVE_PROMPT}${negativePrompt}`,
                  width,
                  height,
                  sampler_name: sampling,
                  steps,
                  seed,
                  cfg_scale: promptWeight,
                  alwayson_scripts: {
                    controlnet: {
                      args:
                          controlNets?.map((e) => ({
                            module: e.module,
                            model: e.model,
                            weight: e.weight,
                            input_image: e.input_image,
                          })) ?? [],
                    },
                    ...(facialRepair
                        ? {
                          ADetailer: WorkshopParams.aDetailer,
                        }
                        : {}),
                  },
                },
              });
            } else {
              await createAiWorkImage({
                txt2img: {
                  type: 'txt2img',
                  base_model: baseModel,
                  prompt: positivePrompt,
                  negative_prompt: `${WORKSHOP_DEFAULT_NEGATIVE_PROMPT}${negativePrompt}`,
                  width,
                  height,
                },
              });
            }
          } else if (generateType === 'ITI' && imageToImageRef.current) {
            const { positivePrompt, negativePrompt, baseImageUri } =
                imageToImageRef.current.getValues();
            if (useAdvance && advancedParamsRef.current) {
              const advancedParams = advancedParamsRef.current.getValues();
              if (!advancedParams) return;
              const {
                sampling,
                steps,
                seed,
                promptWeight,
                facialRepair,
                denoisingStrength,
                controlNets,
              } = advancedParams;
              await createAiWorkImage({
                img2img: {
                  type: 'img2img',
                  base_model: baseModel,
                  prompt: positivePrompt,
                  negative_prompt: `${WORKSHOP_DEFAULT_NEGATIVE_PROMPT}${negativePrompt}`,
                  init_images: [baseImageUri],
                  sampler_name: sampling,
                  steps,
                  seed,
                  cfg_scale: promptWeight,
                  denoising_strength: denoisingStrength,
                  alwayson_scripts: {
                    controlnet: {
                      args:
                          controlNets?.map((e) => ({
                            module: e.module,
                            model: e.model,
                            weight: e.weight,
                            input_image: e.input_image,
                          })) ?? [],
                    },
                    ...(facialRepair
                        ? {
                          ADetailer: WorkshopParams.aDetailer,
                        }
                        : {}),
                  },
                },
              });
            } else {
              await createAiWorkImage({
                img2img: {
                  type: 'img2img',
                  base_model: baseModel,
                  prompt: positivePrompt,
                  negative_prompt: `${WORKSHOP_DEFAULT_NEGATIVE_PROMPT}${negativePrompt}`,
                  init_images: [baseImageUri],
                },
              });
            }
          }
          outputPanelRef.current?.refreshOutputs();
          refreshPoint();
        } catch (e) {
          console.log(e);
        }
      },
      {
        manual: true,
        loadingDelay: 100,
      },
  );

  return (
      <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#49aa19',
            },
          }}
      >
        <Helmet title={formatMessage({ id: 'helmet.workshop.title' })} />
        <div className={styles.container}>
          <SafeArea size={'large'} />
          <div className={styles.rowBetween} style={{ marginBottom: 12 }}>
            <Tabs
                tabs={[
                  {
                    key: 'default',
                    label: formatMessage({ id: 'tabs.workshop' }),
                  },
                ]}
                activeKey={'default'}
                onChange={() => {}}
            />
            <PointButtons onOpenBuyPointModal={openBuyPointModal} />
          </div>
          <Row justify={'space-between'} gutter={48}>
            <Col span={12} style={{ marginBottom: 80, position: 'relative' }}>
              {/* 基底模型 */}
              <div key={'base-model'} className={styles.configItem}>
                <div className={styles.title}>
                  <div>
                    {formatMessage({ id: 'workshop.config.base-model.title' })}
                  </div>
                  <div className={styles.right}>
                    <Space size={4}>
                      <div>
                        {formatMessage({
                          id: 'workshop.config.base-model.scroll-tip',
                        })}
                      </div>
                      <SwapRightOutlined />
                    </Space>
                  </div>
                </div>
                <BaseModelList ref={baseModelRef} />
              </div>
              {/* 人物小模型 */}
              <div key={'person-model'} className={styles.configItem}>
                <div
                    className={classNames(styles.title, {
                      [styles.titleDisabled]: !useFigureModel,
                    })}
                >
                  {!!personModel ? (
                      <Badge
                          count={
                            <CheckCircleFilled
                                style={{ color: '#49aa19', fontSize: 20 }}
                            />
                          }
                      >
                        <div style={{ fontSize: 20 }}>
                          {formatMessage({
                            id: 'workshop.config.person-model.title',
                          })}
                        </div>
                      </Badge>
                  ) : (
                      <div>
                        {formatMessage({
                          id: 'workshop.config.person-model.title',
                        })}
                      </div>
                  )}

                  <div className={styles.right}>
                    <Switch
                        checked={useFigureModel}
                        onChange={(e) => {
                          setUseFigureModel(e);
                          if (!e) {
                            clearPersonModel();
                          }
                        }}
                    />
                  </div>
                </div>
                {useFigureModel && (
                    <SelectModelList type={'PERSON'} ref={selectPersonModelRef} />
                )}
              </div>
              {/* 风格小模型 */}
              <div key={'style-model'} className={styles.configItem}>
                <div
                    className={classNames(styles.title, {
                      [styles.titleDisabled]: !useStyleModel,
                    })}
                >
                  {styleModels.length > 0 ? (
                      <Badge count={styleModels.length} color={'#49aa19'}>
                        <div style={{ fontSize: 20 }}>
                          {formatMessage({
                            id: 'workshop.config.style-model.title',
                          })}
                        </div>
                      </Badge>
                  ) : (
                      <div>
                        {formatMessage({ id: 'workshop.config.style-model.title' })}
                      </div>
                  )}
                  <div className={styles.right}>
                    <Switch
                        checked={useStyleModel}
                        onChange={(e) => {
                          setUseStyleModel(e);
                          if (!e) {
                            clearStyleModels();
                          }
                        }}
                    />
                  </div>
                </div>
                {useStyleModel && (
                    <SelectModelList type={'STYLE'} ref={selectStyleModelRef} />
                )}
              </div>
              {/* 生成类型 */}
              <div key={'generate-type'} className={styles.configItem}>
                <ThemeTabs
                    style={{ fontSize: 20, marginBottom: 12 }}
                    value={generateType}
                    onChange={(e) => setGenerateType(e as any)}
                    tabs={[
                      {
                        label: formatMessage({ id: 'text-to-image' }),
                        key: 'TTI',
                      },
                      {
                        label: formatMessage({ id: 'image-to-image' }),
                        key: 'ITI',
                      },
                    ]}
                />
                {generateType === 'TTI' ? (
                    <TextToImageInput ref={textToImageRef} />
                ) : (
                    <ImageToImageInput ref={imageToImageRef} />
                )}
              </div>
              {/* 高级功能 */}
              <div key={'advanced-params'} className={styles.configItem}>
                <div
                    className={classNames(styles.title, {
                      [styles.titleDisabled]: !useAdvance,
                    })}
                >
                  <div>
                    {formatMessage({ id: 'workshop.config.advanced.title' })}
                  </div>
                  <div className={styles.right}>
                    <Switch
                        checked={useAdvance}
                        onChange={(e) => setUseAdvance(e)}
                    />
                  </div>
                </div>
                {useAdvance && (
                    <AdvancedParams type={generateType} ref={advancedParamsRef} />
                )}
              </div>
              <GenerateButton
                  fixed={true}
                  style={{ width: 600 }}
                  price={price}
                  loading={createLoading}
                  onClick={async () => {
                    if (checkSignedIn()) {
                      runCreate();
                    }
                  }}
              />
            </Col>
            <Col
                span={12}
                style={{ display: 'flex', justifyContent: 'flex-end' }}
            >
              <GenericOutputPanel
                  ref={outputPanelRef}
                  actions={[
                    'one-more',
                    'download',
                    'repaint',
                    'hd',
                    'template',
                    'delete',
                  ]}
                  services={{
                    getOutputs: async (page, pageSize) => {
                      const res = await getAIWorkImages(page, pageSize);
                      return {
                        total: res.aiWorkImagesCount,
                        list: res.aiWorkImages,
                      };
                    },
                    getOutput: async (id) => getAIWorkImage(id),
                    deleteOutput: async (id) => deleteAiWorkImage(id),
                    createHrTask: async (id) => createAiWorkImageHr(id),
                  }}
                  handlers={{
                    onOneMore: (item: API.AiWorkImage) => {
                      if (item.params.type === 'txt2img') {
                        runCreate({
                          txt2img:
                              item.params as API.ImageGenerateParamsTxt2ImgInput,
                        });
                      } else {
                        let params = {
                          ...(item.params as API.ImageGenerateParamsImg2ImgInput),
                          prompt: item.params.img2imgPrompt,
                        };
                        delete params['img2imgPrompt'];
                        runCreate({
                          img2img: params,
                        });
                      }
                    },
                    onRepaint: (item: API.AiWorkImage) =>
                        handleRepaint(
                            item.params,
                            item.hr?.imageUrls.origin || item.imageUrls.origin,
                        ),
                    onTemplate: (item: API.AiWorkImage) =>
                        setCreateTemplateImage(item),
                  }}
              />
            </Col>
          </Row>
        </div>

        <CreateTemplateModal
            data={createTemplateImage}
            open={!!createTemplateImage}
            onSubmit={() => {
              setCreateTemplateImage(undefined);
              outputPanelRef.current?.refreshOutput();
            }}
            onCancel={() => setCreateTemplateImage(undefined)}
        />

        {messageContextHolder}
        {notificationContextHolder}
      </ConfigProvider>
  );
};

export default Index;
