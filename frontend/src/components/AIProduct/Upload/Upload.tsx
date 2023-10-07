import { useIntl, useModel } from '@@/exports';
import styles from './Upload.less';
import { message, theme, Upload, UploadFile } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useContext, useEffect, useState } from 'react';
import { GlobalContext, GlobalContextType } from '@/layouts';

export const AIProductUpload = ({ type }: { type: 'product' | 'model' }) => {
  const { token } = useModel('user', (state) => ({
    token: state.token,
  }));
  const { checkSignedIn } = useContext<GlobalContextType>(GlobalContext);
  const {
    feature,
    segmentTask,
    segmentTaskPolling,
    checkSegmentTaskLoading,
    setCropModalOpen,
    runSegmentTask,
    setSegmentTask,
    mutateLayerMasks,
  } = useModel('product', (state) => ({
    feature: state.feature,
    segmentTask: state.segmentTask,
    segmentTaskPolling: state.segmentTaskPolling,
    checkSegmentTaskLoading: state.checkSegmentTaskLoading,
    setCropModalOpen: state.setCropModalOpen,
    runSegmentTask: state.runSegmentTask,
    setSegmentTask: state.setSegmentTask,
    mutateLayerMasks: state.mutateLayerMasks,
  }));
  const { token: antdToken } = theme.useToken();
  const { formatMessage } = useIntl();
  const [_message, messageContextHolder] = message.useMessage();

  const [fileList, setFileList] = useState<
    (UploadFile & { assetId?: string })[]
  >([]);

  useEffect(() => {
    if (fileList.length > 0) {
      const lastFile = fileList[fileList.length - 1];
      if (lastFile.status === 'done') {
        setSegmentTask(undefined);
        mutateLayerMasks({});
        runSegmentTask(lastFile.response[0].asset);
        setCropModalOpen(true);
      }
    }
  }, [fileList]);

  return (
    <div className={styles.container}>
      <div
        className={styles.title}
        style={{
          backgroundImage:
            type === 'product'
              ? 'linear-gradient(to right, rgba(91, 134, 229, 1), rgba(54, 209, 220, 1))'
              : 'linear-gradient(to right, rgba(52, 148, 230, 1), rgba(236, 110, 173, 1))',
        }}
      >
        {formatMessage({ id: `ai-product.${type}.title` })}
      </div>
      <div className={styles.subTitle}>
        {formatMessage({ id: `ai-product.${type}.subtitle` })}
      </div>
      <div className={styles.row}>
        <img
          className={styles.exampleImage}
          src={
            type === 'product'
              ? 'https://res.aiverse.cc/assets/20230614/a0ac42ec-cfd4-409e-aae6-06959207599f.png'
              : 'https://res.aiverse.cc/assets/20230614/03defcde-4abb-4460-8604-7a46aa04b186.png'
          }
        />
        <Upload
          action="/api/ai-product/images"
          headers={{ authorization: `Bearer ${token}` }}
          listType="picture-card"
          name={'files'}
          fileList={fileList}
          showUploadList={false}
          accept={'image/*'}
          className={`ai-product-upload`}
          onChange={({ fileList }) => {
            if (checkSegmentTaskLoading || segmentTaskPolling) return;
            setFileList(fileList);
          }}
          disabled={checkSegmentTaskLoading}
        >
          <div
            className={styles.uploadCard}
            style={{
              borderColor: antdToken.colorPrimary,
              color: antdToken.colorPrimary,
            }}
            onClick={(e) => {
              if (!checkSignedIn() || checkSegmentTaskLoading) {
                e.preventDefault();
                e.stopPropagation();
              } else if (segmentTaskPolling && segmentTask) {
                const { note } = segmentTask;
                e.preventDefault();
                e.stopPropagation();
                const _feature = JSON.parse(note).feature;
                if (_feature === feature) {
                  setCropModalOpen(true);
                } else {
                  _message.info(
                    formatMessage({
                      id: `ai-product.upload.has-ongoing-${_feature}-segment-task`,
                    }),
                  );
                }
              }
            }}
          >
            <PlusOutlined style={{ fontSize: 20, marginBottom: 6 }} />
            <div>{formatMessage({ id: 'ai-product.upload-text' })}</div>
          </div>
        </Upload>
      </div>
      {messageContextHolder}
    </div>
  );
};
