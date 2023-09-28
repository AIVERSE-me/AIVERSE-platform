import styles from './FineTuneModelTab.less';
import React, { useContext, useEffect, useState } from 'react';
import { useCreation, useMemoizedFn, useRequest } from 'ahooks';
import {
  createFineTuneOutputUsePreset,
  getFineTune,
  getFineTuneOutput,
  getFineTunePresetCatalogs,
  hasProgressingFineTuneOutputs,
} from '@/services/fine-tune';
import { Button, Col, Input, Pagination, Row, Space, theme } from 'antd';
import {
  AppstoreFilled,
  EditFilled,
  CaretRightFilled,
  LeftOutlined,
} from '@ant-design/icons';
import { useIntl, useModel } from '@@/exports';
import FineTuneOutputsModal from '@/components/FineTune/FineTuneOutputsModal/FineTuneOutputsModal';
import 'mac-scrollbar/dist/mac-scrollbar.css';
import GENERATE_LOADING from '@/assets/generate-loading.gif';
import useMessage from 'antd/es/message/useMessage';
import classNames from 'classnames';
import useInterval from '@/hooks/useInterval';
import Tabs from '@/components/Tabs/Tabs';
import { Loading } from '@/components/Icon';
import { getMarketResourcePrice } from '@/components/workshop/utils';
import { publicMarketPersonTemplates } from '@/services/workshop';
import { GlobalContext, GlobalContextType } from '@/layouts';
import PointButtons from '@/components/PointButtons/PointButtons';
import { getGeneratePresets } from '@/services/ai-product';

const PRESET_PAGE_SIZE = 8;
const STYLE_INPUT_PRESET_ID = 'manual.style';

const FineTuneModelTab = ({
  modelId,
  onClose,
}: {
  modelId: string;
  onClose: VoidFunction;
}) => {
  const { point, refreshPoint } = useModel('point', (state) => ({
    point: state.point,
    refreshPoint: state.refreshPoint,
  }));

  const [_message, messageContextHolder] = useMessage();
  const { formatMessage, locale } = useIntl();
  const { token: antToken } = theme.useToken();
  const { openBuyPointModal } = useContext<GlobalContextType>(GlobalContext);

  // const [fineTuneModelLoading, setFineTuneModalLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [outputsModalVisible, setOutputsModalVisible] = useState(false);
  const [output, setOutput] = useState<API.FineTuneOutput>();
  const [showTrainingSet, setShowTrainingSet] = useState(true);
  const [catalog, setCatalog] = useState<string>('');
  const [presetId, setPresetId] = useState('');
  const [price, setPrice] = useState(0);
  const [presetPage, setPresetPage] = useState(1);

  const { data: fineTuneModel } = useRequest(async () => {
    const { finetune } = await getFineTune(modelId);
    if (finetune.type === 'STYLE') {
      setCatalog('input');
      setPresetId(STYLE_INPUT_PRESET_ID);
      setPrompt(`<${finetune!.token}>`);
    }
    return finetune;
  });

  const {
    startInterval: startOutputInterval,
    stopInterval: stopOutputInterval,
  } = useInterval(2000, {
    immediate: true,
  });

  const pollOutput = useMemoizedFn((id: string) => {
    startOutputInterval(async () => {
      try {
        const { finetuneOutput } = await getFineTuneOutput(id);
        setOutput(finetuneOutput);
        if (
          finetuneOutput.status === 'FINISHED' ||
          finetuneOutput.status === 'ERROR'
        ) {
          return false;
        }
      } catch (e) {}
      return true;
    });
  });

  const {
    runAsync: runCreateFineTuneOutput,
    loading: createFineTuneOutputLoading,
  } = useRequest(
    async () => {
      if (!fineTuneModel) return;
      const hasProgressing = await hasProgressingFineTuneOutputs();
      if (hasProgressing) {
        _message.info(
          formatMessage({ id: 'fine-tune.model.generate.has-progressing' }),
        );
        return;
      }

      setOutput(undefined);
      const { createFinetuneOutputUsePreset: output } =
        await createFineTuneOutputUsePreset(
          fineTuneModel.id,
          presetId,
          catalog === 'input' ? prompt : undefined,
        );
      setOutput(output);
      pollOutput(output.id);
      refreshPoint();
    },
    {
      manual: true,
    },
  );

  const outputPolling = useCreation(
    () =>
      createFineTuneOutputLoading ||
      output?.status === 'CREATED' ||
      output?.status === 'STARTED',
    [createFineTuneOutputLoading, output],
  );

  const fineTuneGender = useCreation(
    () =>
      fineTuneModel
        ? fineTuneModel.type === 'PERSON'
          ? (fineTuneModel.typeParams as API.FineTunePersonTypeParams).gender
          : undefined
        : undefined,
    [fineTuneModel],
  );
  const { data: fineTunePresetCatalogs = [] } = useRequest(
    async () => {
      if (!fineTuneGender) {
        return [];
      } else {
        try {
          const finetunePresetCatalogs = await getFineTunePresetCatalogs();
          setCatalog(finetunePresetCatalogs[0].id);
          return finetunePresetCatalogs;
        } catch (e) {
          console.log(e);
        }
      }
    },
    {
      refreshDeps: [fineTuneGender],
    },
  );

  const {
    data: officialPresets = { list: [], total: 0 },
    loading: officialPresetsLoading,
  } = useRequest(
    async () => {
      if (!catalog || catalog === 'input' || !fineTuneGender)
        return {
          list: [],
          total: 0,
        };
      const { generatePresets: presets, generatePresetsCount: count } =
        await getGeneratePresets(catalog, fineTuneGender, 1, 9999);

      return {
        list: presets,
        total: count,
      };
    },
    {
      refreshDeps: [catalog],
      loadingDelay: 200,
    },
  );

  const [marketPresetsStorage, setMarketPresetsStorage] = useState<
    API.GeneratePreset[][]
  >([]);

  const marketPresetsPage = useCreation(
    () => presetPage - Math.floor(officialPresets.total / PRESET_PAGE_SIZE),
    [presetPage, officialPresets],
  );
  const {
    data: marketPresets = {
      list: [],
      total: 0,
    },
    loading: marketPresetsLoading,
  } = useRequest(
    async () => {
      if (!catalog || catalog === 'input' || !fineTuneGender)
        return {
          list: [],
          total: 0,
        };
      if (marketPresetsPage <= 0) return;
      const {
        publicMarketPersonTemplatesCount: count,
        publicMarketPersonTemplates: templates,
      } = await publicMarketPersonTemplates(
        catalog,
        fineTuneGender,
        marketPresetsPage,
        PRESET_PAGE_SIZE,
      );
      const _marketPresetsStorage = [...marketPresetsStorage];
      _marketPresetsStorage[marketPresetsPage - 1] = templates;
      setMarketPresetsStorage(_marketPresetsStorage);

      return { list: templates, total: count };
    },
    {
      refreshDeps: [catalog, marketPresetsPage],
      loadingDelay: 200,
    },
  );

  const presets = useCreation(
    () => [
      ...officialPresets.list,
      ...([] as any).concat(...marketPresetsStorage),
    ],
    [officialPresets, marketPresetsStorage],
  );

  useEffect(() => {
    setMarketPresetsStorage([]);
    setPresetPage(1);
  }, [catalog]);

  return (
    <>
      {fineTuneModel && fineTuneModel.status === 'FINISHED' && (
        <div>
          <div className={styles.header}>
            <Space size={6} className={styles.modelTitle}>
              <LeftOutlined style={{ cursor: 'pointer' }} onClick={onClose} />
              <div>{fineTuneModel.index.displayName}</div>
            </Space>
            <PointButtons />
          </div>
          <div className={styles.actions}>
            {fineTuneModel?.status === 'FINISHED' && (
              <Button
                icon={<AppstoreFilled />}
                shape={'round'}
                type={'primary'}
                onClick={() => {
                  setOutputsModalVisible(true);
                }}
              >
                {formatMessage(
                  { id: 'fine-tune.collections' },
                  { token: fineTuneModel.token },
                )}
              </Button>
            )}
          </div>
          <div
            className={styles.trainingSetTitle}
            onClick={() => setShowTrainingSet(!showTrainingSet)}
          >
            <CaretRightFilled
              className={styles.trainingSetIcon}
              style={{
                transform: showTrainingSet ? 'rotate(90deg)' : 'rotate(0deg)',
              }}
            />
            {formatMessage({ id: 'fine-tune.training-set' })}
          </div>
          <div className={styles.inputImageWrapper}>
            <div
              className={styles.inputImagesRow}
              style={{ minHeight: showTrainingSet ? 150 : 0 }}
            >
              {fineTuneModel.inputImages.map((image) => (
                <img key={image} className={styles.inputImage} src={image} />
              ))}
              <div style={{ minWidth: 75, height: '100%' }} />
            </div>
            <div className={styles.end} />
          </div>
          <>
            <Tabs
              style={{ marginBottom: 12, marginTop: 24 }}
              size={'small'}
              tabs={
                fineTuneModel.type === 'PERSON'
                  ? fineTunePresetCatalogs.map((e) => ({
                      key: e.id,
                      label: locale === 'zh-CN' ? e.titleZh : e.titleEn,
                    }))
                  : [
                      {
                        key: 'input',
                        label: formatMessage({
                          id: 'fine-tune.examples.input',
                        }),
                      },
                    ]
              }
              activeKey={catalog}
              onChange={(tab: any) => {
                if (outputPolling) {
                  _message.info(
                    formatMessage({
                      id: 'fine-tune.model.examples-tooltip.loading',
                    }),
                  );
                } else {
                  setCatalog(tab);
                  setPresetPage(1);
                }
              }}
            />
            {presetId === STYLE_INPUT_PRESET_ID ? (
              <></>
            ) : officialPresetsLoading || marketPresetsLoading ? (
              <div style={{ textAlign: 'center' }}>
                <Loading />
              </div>
            ) : (
              <>
                <Row gutter={[12, 12]}>
                  {presets
                    .slice(
                      (presetPage - 1) * PRESET_PAGE_SIZE,
                      presetPage * PRESET_PAGE_SIZE,
                    )
                    .map((e) => {
                      return (
                        <Col key={e.id} span={24 / PRESET_PAGE_SIZE}>
                          <div
                            className={classNames(styles.exampleCard, {
                              [styles.selected]: presetId === e.id,
                            })}
                            onClick={() => {
                              if (outputPolling) {
                                _message.info(
                                  formatMessage({
                                    id: 'fine-tune.model.examples-tooltip.loading',
                                  }),
                                );
                              } else {
                                setPresetId(e.id);
                                setPrice(
                                  getMarketResourcePrice(e.marketResource) ?? 0,
                                );
                                setPrompt(`<${fineTuneModel!.token}>`);
                              }
                            }}
                          >
                            <img
                              className={classNames(styles.exampleImg)}
                              src={e.displayImgUrl}
                            />
                            {e.marketResource && (
                              <div
                                className={classNames(styles.priceMask, {
                                  [styles.free]:
                                    getMarketResourcePrice(e.marketResource) ===
                                    0,
                                })}
                              >
                                {e.marketResource.free
                                  ? formatMessage({ id: 'workshop.price-free' })
                                  : new Date(
                                      e.marketResource.freeEnd,
                                    ).getTime() >= Date.now()
                                  ? formatMessage({
                                      id: 'workshop.price-limited-free',
                                    })
                                  : formatMessage(
                                      { id: 'workshop.price' },
                                      { price: e.marketResource.price },
                                    )}
                              </div>
                            )}
                          </div>
                        </Col>
                      );
                    })}
                </Row>
                <div
                  style={{
                    textAlign: 'center',
                    width: '100%',
                    marginTop: 12,
                  }}
                >
                  <Pagination
                    current={presetPage}
                    pageSize={PRESET_PAGE_SIZE}
                    total={officialPresets.total + marketPresets.total}
                    onChange={setPresetPage}
                  />
                </div>
              </>
            )}
            {catalog === 'input' && (
              <div style={{ marginBottom: 0 }}>
                <div className={styles.title} style={{ marginTop: 12 }}>
                  <div>
                    <EditFilled className={styles.icon} />
                    {formatMessage(
                      {
                        id: `fine-tune.model.generate-title.${fineTuneModel.type.toLowerCase()}`,
                      },
                      { token: fineTuneModel.token },
                    )}
                  </div>
                  <div>
                    {formatMessage(
                      {
                        id: `fine-tune.model.generate-tip.${fineTuneModel.type.toLowerCase()}${
                          fineTuneModel.type === 'PERSON'
                            ? `-${(
                                fineTuneModel.typeParams as API.FineTunePersonTypeParams
                              ).gender.toLowerCase()}`
                            : ''
                        }`,
                      },
                      { token: fineTuneModel.token },
                    )}
                  </div>
                </div>
                <Input.TextArea
                  size={'large'}
                  value={prompt}
                  disabled={outputPolling}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  style={{ resize: 'none' }}
                />
              </div>
            )}
            <div className={styles.generateButtonContainer}>
              <Button
                loading={outputPolling}
                style={{ width: 300 }}
                size={'large'}
                shape={'round'}
                type={'primary'}
                onClick={() => {
                  if (catalog === 'input') {
                    if (!prompt) {
                      _message.info(
                        formatMessage({
                          id: 'fine-tune.model.generate.empty-tip',
                        }),
                      );
                      return;
                    }
                    const token = `<${fineTuneModel!.token}>`;
                    if (prompt.includes(token)) {
                      runCreateFineTuneOutput();
                    } else {
                      _message.info(
                        formatMessage(
                          { id: 'fine-tune.model.generate.token-required' },
                          { token },
                        ),
                      );
                    }
                  } else {
                    if (!presetId) {
                      _message.info(
                        formatMessage({
                          id: 'fine-tune.model.generate.preset-required',
                        }),
                      );
                    } else {
                      if (price > point) {
                        _message.info(formatMessage({ id: 'recharge-tip' }));
                        openBuyPointModal();
                      } else {
                        runCreateFineTuneOutput();
                      }
                    }
                  }
                }}
              >
                {outputPolling ? (
                  formatMessage(
                    { id: 'fine-tune.model.generating' },
                    {
                      progress: Math.max(output?.progress || 0, 5),
                    },
                  )
                ) : (
                  <>
                    {price > 0
                      ? formatMessage(
                          { id: 'fine-tune.model.generate-price' },
                          { point: price },
                        )
                      : formatMessage({ id: 'fine-tune.model.generate' })}
                  </>
                )}
              </Button>
            </div>
          </>
          <div
            className={styles.generatingContainer}
            style={{
              height: output ? 512 : 0,
            }}
          >
            {outputPolling && <img src={GENERATE_LOADING} />}
            {output?.status === 'FINISHED' && <img src={output.image} />}
            {output?.status === 'ERROR' && (
              <div className={styles.outputErrorCard}>
                <div className={styles.title}>
                  {formatMessage({ id: 'fine-tune.model.task-failed' })}
                </div>
                <div className={styles.desc}>
                  {formatMessage({ id: 'fine-tune.model.task-failed.desc' })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {fineTuneModel?.status === 'FINISHED' && (
        <>
          <FineTuneOutputsModal
            fineTuneToken={fineTuneModel.token}
            fineTuneId={fineTuneModel.id}
            open={outputsModalVisible}
            onClose={() => setOutputsModalVisible(false)}
          />
        </>
      )}

      {messageContextHolder}
    </>
  );
};

export default FineTuneModelTab;
