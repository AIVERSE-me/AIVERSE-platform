import styles from './CreatePanel.less';
import {
  Button,
  Col,
  Input,
  Row,
  Spin,
  theme,
  Tooltip,
  Upload,
  UploadFile,
} from 'antd';
import { Configure } from '@/constants';
import {
  CloseOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { useIntl, useModel } from '@@/exports';
import { GlobalContext, GlobalContextType } from '@/layouts';
import {
  useCreation,
  useDebounceEffect,
  useHover,
  useMemoizedFn,
  useRequest,
} from 'ahooks';
import {
  createFineTuneImageDetectionTasks,
  createPersonFineTune,
  createStyleFineTune,
  getFineTuneImageDetectionTasks,
  hasFineTuneInTraining,
} from '@/services/fine-tune';
import useModal from 'antd/es/modal/useModal';
import useMessage from 'antd/es/message/useMessage';
import UploadTipModal from '@/components/FineTune/UploadTipModal/UploadTipModal';
import useInterval from '@/hooks/useInterval';
import { compressImage, isImageSupported } from '@/utils/utils';
import { ThemeSwitch } from '@/components/Switch/Switch';

const UploadImage = ({
  url,
  onRemove,
}: {
  url: string;
  onRemove: VoidFunction;
}) => {
  const ref = useRef(null);
  const hovered = useHover(ref);

  return (
    <div ref={ref} className={styles.uploadImageContainer}>
      <img src={url} />
      <div
        className={styles.deleteMask}
        style={{
          backgroundColor: hovered ? 'rgb(0 0 0 / 50%)' : 'transparent',
        }}
      >
        {hovered && (
          <DeleteOutlined style={{ cursor: 'pointer' }} onClick={onRemove} />
        )}
      </div>
    </div>
  );
};

const CreatePanel = ({
  type,
  onCreated,
}: {
  type: API.FineTuneType;
  onCreated: (fineTuneId: string) => void;
}) => {
  const { currentUser, token } = useModel('user', (state) => ({
    token: state.token,
    currentUser: state.currentUser,
  }));
  const { checkSignedIn } = useContext<GlobalContextType>(GlobalContext);
  const { formatMessage, locale } = useIntl();
  const [modal, modalContextHolder] = useModal();
  const [message, messageContextHolder] = useMessage();
  const { token: antdToken } = theme.useToken();

  const uploadEmptyCardRef = useRef<HTMLDivElement>(null);

  const [fileList, setFileList] = useState<
    (UploadFile & { assetId?: string })[]
  >([]);
  const [detectionList, setDetectionList] = useState<string[]>([]);
  const [detectionTasks, setDetectionTasks] = useState<
    API.ImageDetectionTask[]
  >([]);
  const [modelPrompt, setModelPrompt] = useState('');
  const [gender, setGender] = useState<API.FineTuneGender>('MALE');
  const [uploadTipOpen, setUploadTipOpened] = useState(false);
  const [clickUploadAfterTipClosed, setClickUploadAfterTipClosed] =
    useState(false);
  const [createDetectionTaskLoading, setCreateDetectionTaskLoading] =
    useState(false);
  const [uploading, setUploading] = useState(false);
  const [compressCount, setCompressCount] = useState(0);

  const doneFiles = useCreation(
    () => fileList.filter((f) => f.status === 'done' && f.response?.[0]?.asset),
    [fileList],
  );
  const loadedFiles = useCreation(
    () => fileList.filter((f) => f.status === 'error' || f.status === 'done'),
    [fileList],
  );
  const loadingFiles = useCreation(
    () => fileList.filter((f) => f.status !== 'error' && f.status !== 'done'),
    [fileList],
  );
  const errorFiles = useCreation(
    () => fileList.filter((f) => f.status === 'error'),
    [fileList],
  );

  const {
    polling: imageDetectionPolling,
    startInterval: startImageDetection,
    stopInterval: stopImageDetection,
  } = useInterval(500, { immediate: true });

  useDebounceEffect(
    () => {
      if (!fileList.length || type !== 'PERSON') {
        setCreateDetectionTaskLoading(false);
        return;
      }
      if (detectionTasks.length === doneFiles.length) return;

      const toDetect = doneFiles
        .filter(
          (f) => !detectionTasks.find((t) => t.assetId === f.response[0].asset),
        )
        .map((f) => f.response[0].asset);
      if (!toDetect.length) {
        setCreateDetectionTaskLoading(false);
        return;
      }

      setDetectionList(toDetect);
    },
    [doneFiles, detectionTasks],
    { wait: 500 },
  );

  useEffect(() => {
    if (!detectionList.length || !fileList.length) return;

    if (
      fileList.every((f) => f.status === 'done' || f.status === 'error') &&
      detectionList.length + detectionTasks.length === doneFiles.length
    ) {
      createFineTuneImageDetectionTasks(detectionList)
        .then(({ createImageDetectionTasks }) => {
          setDetectionList([]);
          setDetectionTasks((state) => [
            ...state,
            ...createImageDetectionTasks,
          ]);

          startImageDetection(async () => {
            const { queryImageDetectionTasks: detectionTasks } =
              await getFineTuneImageDetectionTasks(
                loadedFiles.map((f) => f.response[0].asset),
              );
            setDetectionTasks(detectionTasks);
            setCreateDetectionTaskLoading(false);
            return detectionTasks.some(
              (t) => t.status === 'CREATED' || t.status === 'STARTED',
            );
          });
        })
        .catch(() => {
          setCreateDetectionTaskLoading(false);
        });
    }
  }, [detectionList, detectionTasks, doneFiles]);

  const handleRemoveFile = useMemoizedFn((uid: string, assetId?: string) => {
    setFileList((fileList) => fileList.filter((f) => f.uid !== uid));
    if (assetId) {
      setDetectionTasks((tasks) => tasks.filter((t) => t.assetId !== assetId));
    }
  });

  const getFilesByAssetIds = useMemoizedFn((assetIds: string[]) => {
    const images: UploadFile[] = [];
    for (const id of assetIds) {
      const file = fileList.find((f) => f.response?.[0]?.asset === id);
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      file && images.push(file);
    }
    return images;
  });

  const approvedFiles = useCreation(
    () =>
      getFilesByAssetIds(
        detectionTasks
          .filter((t) => t.status === 'FINISHED' && t.result === 'SUCCESS')
          .map((t) => t.assetId),
      ),
    [detectionTasks],
  );
  const declinedFiles = useCreation(
    () =>
      getFilesByAssetIds(
        detectionTasks
          .filter((t) => t.status === 'FINISHED' && t.result === 'FAIL')
          .map((t) => t.assetId),
      ),
    [detectionTasks],
  );
  const detectionProgress = useCreation(() => {
    const done = detectionTasks.filter(
      (t) => t.status === 'FINISHED' || t.status === 'ERROR',
    ).length;
    return {
      done,
      total: detectionTasks.length,
    };
  }, [detectionTasks]);

  useEffect(() => {
    if (loadingFiles.length === 0) {
      setUploading(false);
    }
  }, [loadingFiles]);

  const minImageCount = useCreation(
    () => Configure.fineTune.imageCount[type].min,
    [type],
  );

  const maxImageCount = useCreation(
    () => Configure.fineTune.imageCount[type].max,
    [type],
  );

  const {
    data: fineTuneInTraining,
    refreshAsync: refreshHasFineTuneInTraining,
  } = useRequest(async () => {
    return await hasFineTuneInTraining();
  });

  const { runAsync: runCreateFineTune, loading: createFineTuneLoading } =
    useRequest(
      async () => {
        try {
          let fineTune: API.FineTune;
          if (type === 'PERSON') {
            const inputImages = approvedFiles
              .map((f) => f.response[0].asset)
              .slice(0, maxImageCount);
            const { createPersonFinetune } = await createPersonFineTune({
              gender,
              inputImages,
              token: modelPrompt,
            });
            fineTune = createPersonFinetune;
          } else {
            const inputImages = fileList
              .filter((f) => f.status === 'done' && f.response?.[0]?.asset)
              .map((f) => f.response[0].asset)
              .slice(0, maxImageCount);
            const { createStyleFinetune } = await createStyleFineTune({
              inputImages,
              token: modelPrompt,
            });
            fineTune = createStyleFinetune;
          }

          if (fineTune) {
            onCreated(fineTune.id);
            message.success(
              formatMessage({ id: 'fine-tune.start-fine-tuning-success' }),
            );
          }
        } catch (e) {
          message.error(
            formatMessage({ id: 'fine-tune.start-fine-tuning-failed' }),
          );
        }
      },
      {
        manual: true,
      },
    );

  const handleUploadClicked = useMemoizedFn((e) => {
    if (!checkSignedIn() || fineTuneInTraining) {
      e.stopPropagation();
      e.preventDefault();
    } else if (uploadTipOpen) {
      setUploadTipOpened(false);
      setClickUploadAfterTipClosed(false);
    } else {
      e.stopPropagation();
      e.preventDefault();
      setUploadTipOpened(true);
      setClickUploadAfterTipClosed(true);
    }
  });

  const fileCount = useCreation(
    () =>
      type === 'PERSON'
        ? approvedFiles.length
        : fileList.filter((f) => f.status === 'done' && f.response?.[0].asset)
            .length,
    [type, approvedFiles, fileList],
  );

  const imagesRequired = useCreation(
    () => minImageCount - fileCount,
    [fileCount, minImageCount],
  );

  return (
    <>
      <div
        className={styles.featureTitle}
        style={{ backgroundColor: antdToken.colorPrimary }}
      >
        {formatMessage({ id: `fine-tune.title.${type}` })}
      </div>
      <Row
        style={{
          justifyContent: 'space-between',
        }}
        gutter={24}
      >
        <Col span={14}>
          {type === 'PERSON' && (
            <>
              <div className={styles.introCard}>
                <div className={styles.title}>
                  {formatMessage({ id: 'fine-tune.intro-title.object' })}
                </div>
                <img
                  src={`https://res.aiverse.cc/assets/mini/${locale}/example-person-1.png`}
                />
              </div>
              <div className={styles.introDivider} />
              <div className={styles.featureCard}>
                <div className={styles.title}>
                  {formatMessage({ id: 'fine-tune.intro-title.planned' })}
                </div>
                <img
                  src={`https://res.aiverse.cc/assets/mini/${locale}/example-person-2.png`}
                />
              </div>
            </>
          )}

          {type === 'STYLE' && (
            <div className={styles.introCard}>
              <div className={styles.title}>
                {formatMessage({ id: 'fine-tune.intro-title.style' })}
              </div>
              <img
                style={{ marginBottom: 24 }}
                src={`https://res.aiverse.cc/assets/mini/${locale}/example-style-1.png`}
              />
              <img
                src={`https://res.aiverse.cc/assets/mini/${locale}/example-style-2.png`}
              />
            </div>
          )}
        </Col>
        <Col span={10}>
          <div className={styles.formContainer}>
            {type === 'PERSON' && (
              <div className={styles.formItem}>
                <div className={styles.title}>
                  {formatMessage({ id: 'fine-tune.create.gender' })}
                </div>
                <ThemeSwitch<API.FineTuneGender>
                  value={gender}
                  onChange={(e) => setGender(e)}
                  options={[
                    {
                      label: formatMessage({
                        id: 'fine-tune.create.gender.male',
                      }),
                      key: 'MALE',
                    },
                    {
                      label: formatMessage({
                        id: 'fine-tune.create.gender.female',
                      }),
                      key: 'FEMALE',
                    },
                  ]}
                />
              </div>
            )}
            <Spin
              delay={100}
              spinning={
                imageDetectionPolling || createDetectionTaskLoading || uploading
              }
              tip={
                compressCount > 0
                  ? formatMessage(
                      { id: 'fine-tune.create.upload-photos.compress' },
                      { progress: compressCount },
                    )
                  : imageDetectionPolling
                  ? formatMessage(
                      { id: 'fine-tune.create.upload-photos.detecting' },
                      {
                        progress: `${detectionProgress.done}/${detectionProgress.total}`,
                      },
                    )
                  : formatMessage(
                      { id: 'fine-tune.create.upload-photos.uploading' },
                      {
                        progress:
                          loadedFiles.length < fileList.length
                            ? `${loadedFiles.length}/${fileList.length}`
                            : '',
                      },
                    )
              }
            >
              <div className={styles.formItem}>
                <div className={styles.title}>
                  {formatMessage({ id: 'fine-tune.create.upload-photos' })}{' '}
                  <Tooltip
                    title={formatMessage({ id: 'fine-tune.model.upload-tip' })}
                  >
                    <InfoCircleOutlined
                      className={styles.icon}
                      onClick={() => setUploadTipOpened(true)}
                    />
                  </Tooltip>
                </div>
                {type === 'STYLE' &&
                  imagesRequired > 0 &&
                  imagesRequired < Configure.fineTune.imageCount.STYLE.min && (
                    <div className={styles.uploadApproved}>
                      <div className={styles.tipTitle}>
                        {formatMessage(
                          {
                            id: 'fine-tune.create.upload-photos.required',
                          },
                          { required: imagesRequired },
                        )}
                      </div>
                    </div>
                  )}
                <Upload
                  disabled={loadingFiles.length > 0 || fineTuneInTraining}
                  className={`fine-tune-upload-${type.toLowerCase()} ${
                    fileList.length === 0 ? 'fine-tune-upload' : ''
                  }`}
                  action="/finetune/images"
                  headers={{ authorization: `Bearer ${token}` }}
                  listType="picture-card"
                  name={'files'}
                  fileList={fileList}
                  showUploadList={
                    type === 'PERSON'
                      ? true
                      : {
                          showPreviewIcon: false,
                          showRemoveIcon: true,
                          showDownloadIcon: false,
                        }
                  }
                  accept={'image/*'}
                  multiple={true}
                  beforeUpload={async (file) => {
                    const supported = await isImageSupported(file);
                    if (!supported) {
                      message.info(
                        formatMessage(
                          { id: 'fine-tune.create.upload-photos.unsupported' },
                          {
                            filename: file.name,
                          },
                        ),
                      );
                      return Upload.LIST_IGNORE;
                    }

                    const extension = file.name.split('.').slice(-1);
                    const newFile = new File(
                      [file],
                      `${file.uid}.${extension}`,
                      {
                        type: file.type,
                      },
                    );
                    // @ts-ignore
                    newFile.uid = file.uid;
                    setUploading(true);
                    if (
                      newFile.size >
                      Configure.fineTune.imageCompressThreshold * 1024 * 1024
                    ) {
                      setCompressCount((compressCount) => compressCount + 1);
                      return compressImage(newFile, {
                        onSuccess: () =>
                          setCompressCount(
                            (compressCount) => compressCount - 1,
                          ),
                        onFail: () =>
                          setCompressCount(
                            (compressCount) => compressCount - 1,
                          ),
                      });
                    } else {
                      return newFile;
                    }
                  }}
                  onChange={({ fileList: newFileList }) => {
                    if (type === 'PERSON') {
                      setCreateDetectionTaskLoading(true);
                    }
                    setFileList(newFileList);
                  }}
                >
                  {fileList.length > 0 ? (
                    <div ref={uploadEmptyCardRef} onClick={handleUploadClicked}>
                      <PlusOutlined />
                      <div>
                        {formatMessage({
                          id: 'fine-tune.create.upload-photos',
                        })}
                      </div>
                    </div>
                  ) : (
                    <div
                      ref={uploadEmptyCardRef}
                      className={styles.uploadEmptyCard}
                      onClick={handleUploadClicked}
                    >
                      <PlusOutlined />
                      <div
                        style={{
                          marginTop: 8,
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {formatMessage(
                          { id: 'fine-tune.create.upload-photos-tip' },
                          {
                            count: (
                              <b style={{ color: antdToken.colorPrimary }}>
                                {minImageCount}-{maxImageCount}
                              </b>
                            ),
                          },
                        )}
                      </div>
                    </div>
                  )}
                </Upload>
                {approvedFiles.length > 0 && (
                  <div className={styles.uploadApproved}>
                    <div className={styles.tipTitle}>
                      {imagesRequired > 0
                        ? formatMessage(
                            {
                              id: 'fine-tune.create.upload-photos.approved-required',
                            },
                            { required: imagesRequired },
                          )
                        : formatMessage({
                            id: 'fine-tune.create.upload-photos.approved',
                          })}
                    </div>
                    <div className={styles.tipDesc}>
                      {formatMessage(
                        {
                          id: 'fine-tune.create.upload-photos.approved.desc',
                        },
                        {
                          min: minImageCount,
                          max: maxImageCount,
                        },
                      )}
                    </div>
                    <Row gutter={[6, 6]}>
                      {approvedFiles.map((f) => (
                        <Col key={`approved_${f.uid}`} flex={'20%'}>
                          <UploadImage
                            url={f.thumbUrl!}
                            onRemove={() =>
                              handleRemoveFile(f.uid, f.response[0].asset)
                            }
                          />
                        </Col>
                      ))}
                    </Row>
                  </div>
                )}
                {declinedFiles.length > 0 && (
                  <div className={styles.uploadApproved}>
                    <div className={styles.tipTitle}>
                      {formatMessage({
                        id: 'fine-tune.create.upload-photos.declined',
                      })}
                    </div>
                    <div className={styles.tipDesc}>
                      {formatMessage({
                        id: 'fine-tune.create.upload-photos.declined.desc',
                      })}
                    </div>
                    <Row gutter={[6, 6]}>
                      {declinedFiles.map((f) => (
                        <Col key={`declined_${f.uid}`} flex={'20%'}>
                          <UploadImage
                            url={f.thumbUrl!}
                            onRemove={() =>
                              handleRemoveFile(f.uid, f.response[0].asset)
                            }
                          />
                        </Col>
                      ))}
                    </Row>
                  </div>
                )}
                {errorFiles.length > 0 && (
                  <div className={styles.uploadApproved}>
                    <div className={styles.tipTitle}>
                      <CloseOutlined style={{ color: '#f5222d' }} />{' '}
                      {formatMessage({
                        id: 'fine-tune.create.upload-photos.failed',
                      })}
                    </div>
                    <div className={styles.tipDesc}>
                      {formatMessage({
                        id: 'fine-tune.create.upload-photos.failed.desc',
                      })}
                    </div>
                    <Row gutter={[6, 6]}>
                      {errorFiles.map((f) => (
                        <Col key={`error_${f.uid}`} flex={'20%'}>
                          <UploadImage
                            url={f.thumbUrl!}
                            onRemove={() => handleRemoveFile(f.uid)}
                          />
                        </Col>
                      ))}
                    </Row>
                  </div>
                )}
              </div>
            </Spin>
            <div className={styles.formItem}>
              <div className={styles.title}>
                {formatMessage({ id: 'fine-tune.create.arousal-words' })}
              </div>
              <Input
                disabled={fineTuneInTraining}
                value={modelPrompt}
                onChange={(e) => setModelPrompt(e.target.value)}
                size={'large'}
                maxLength={20}
                placeholder={formatMessage({
                  id: 'fine-tune.create.arousal-words.placeholder',
                })}
              />
            </div>
            <div className={styles.formItem}>
              <Button
                disabled={fineTuneInTraining}
                loading={createFineTuneLoading}
                onClick={async () => {
                  // 未登录
                  if (!currentUser) {
                    checkSignedIn();
                    return;
                  }

                  if (await refreshHasFineTuneInTraining()) {
                    message.info(
                      formatMessage({
                        id: 'fine-tune.start-fine-tuning.in-training',
                      }),
                    );
                    return;
                  }

                  // 未输入唤醒词
                  if (!modelPrompt) {
                    message.info(
                      formatMessage({
                        id: 'fine-tune.create.arousal-words.placeholder',
                      }),
                    );
                    return;
                  }

                  // 文件上传中
                  if (fileList.some((f) => f.status === 'uploading')) {
                    message.info(
                      formatMessage({ id: 'fine-tune.file-uploading' }),
                    );
                    return;
                  }

                  // 质量检测中
                  if (imageDetectionPolling) {
                    message.info(
                      formatMessage(
                        {
                          id: 'fine-tune.create.upload-photos.detecting',
                        },
                        { progress: '' },
                      ),
                    );
                    return;
                  }

                  // 图片数量不足
                  if (fileCount < minImageCount) {
                    message.info(
                      formatMessage(
                        { id: 'fine-tune.insufficient-uploaded-images' },
                        { min: minImageCount },
                      ),
                    );
                    return;
                  }

                  // 上传文件超过数量
                  if (fileCount > maxImageCount) {
                    modal.confirm({
                      centered: true,
                      title: formatMessage(
                        {
                          id: 'fine-tune.overflow-uploaded-images',
                        },
                        { max: maxImageCount },
                      ),
                      content: formatMessage({
                        id: 'fine-tune.overflow-uploaded-images.desc',
                      }),
                      okText: formatMessage({
                        id: 'fine-tune.overflow-uploaded-images.desc.ok',
                      }),
                      cancelText: formatMessage({
                        id: 'fine-tune.overflow-uploaded-images.desc.cancel',
                      }),
                      onOk: () => {
                        runCreateFineTune();
                      },
                    });
                    return;
                  }

                  runCreateFineTune();
                }}
                shape={'round'}
                type={'primary'}
                size={'large'}
                block={true}
              >
                {fineTuneInTraining ? (
                  formatMessage({ id: 'fine-tune.start-fine-tuning.training' })
                ) : (
                  <>
                    {formatMessage({ id: 'fine-tune.start-fine-tuning' })} (
                    <span
                      style={{
                        textDecoration: 'line-through',
                        margin: '0 4px',
                      }}
                    >
                      250Points
                    </span>
                    {formatMessage({ id: 'fine-tune.start-fine-tuning.free' })})
                  </>
                )}
              </Button>
            </div>
            <UploadTipModal
              type={type}
              open={uploadTipOpen}
              onOk={() => {
                uploadEmptyCardRef?.current?.click();
              }}
              onClose={() => {
                setClickUploadAfterTipClosed(false);
                setUploadTipOpened(false);
              }}
              footer={clickUploadAfterTipClosed}
            />
            {modalContextHolder}
            {messageContextHolder}
          </div>
        </Col>
      </Row>
    </>
  );
};

export default CreatePanel;
