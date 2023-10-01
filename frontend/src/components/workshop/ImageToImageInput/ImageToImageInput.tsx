import React, {
  forwardRef,
  useContext,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import styles from '../index.less';
import { PlusOutlined } from '@ant-design/icons';
import { message, theme, Upload, UploadFile } from 'antd';
import { useIntl, useModel } from '@@/exports';
import PromptInputGroup, {
  PromptInputGroupRefs,
  PromptInputGroupType,
} from '@/components/workshop/PromptInputGroup/PromptInputGroup';
import { useCreation } from 'ahooks';
import { GlobalContext, GlobalContextType } from '@/layouts';

export type ImageToImageInputType = {
  baseImageUri: string;
  maskImageUri: string;
  maskedImageUri: string;
  // maskInverted: boolean;
  // feather: number;
} & PromptInputGroupType;

export interface ImageToImageInputRefs {
  getValues: () => ImageToImageInputType;
  setValues: (values: Partial<ImageToImageInputType>) => void;
}

const ImageToImageInput = forwardRef<ImageToImageInputRefs, any>(({}, ref) => {
  const { token } = useModel('user', (state) => ({
    token: state.token,
  }));
  const { checkSignedIn } = useContext<GlobalContextType>(GlobalContext);
  const [_message, messageContextHolder] = message.useMessage();
  const { token: antdToken } = theme.useToken();
  const { formatMessage } = useIntl();
  const promptInputGroupRef = useRef<PromptInputGroupRefs>(null);

  const [fileList, setFileList] = useState<
    (UploadFile & { assetId?: string })[]
  >([]);

  const [baseImageAsset, setBaseImageAsset] = useState('');
  const [maskImageUri, setMaskImageUri] = useState('');
  const [maskedImageUri, setMaskedImageUri] = useState('');
  // const [maskInverted, setMaskInverted] = useState(false)
  // const [feather, setFeather] = useState(32)

  useImperativeHandle(ref, () => ({
    getValues: () => {
      const { positivePrompt = '', negativePrompt = '' } =
        promptInputGroupRef.current?.getValues() || {};
      return {
        positivePrompt,
        negativePrompt,
        baseImageUri: baseImageAsset,
        maskImageUri,
        maskedImageUri,
      };
    },
    setValues: (values) => {
      if (values.baseImageUri) {
        setBaseImageAsset(values.baseImageUri);
      }
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
    },
  }));

  const uploading = useCreation(
    () => fileList[fileList.length - 1]?.status === 'uploading',
    [fileList],
  );

  return (
    <>
      <div className={styles.configSubItem}>
        <Upload
          action="/api/ai-work-images/used-images"
          headers={{ authorization: `Bearer ${token}` }}
          listType="picture-card"
          name={'files'}
          fileList={fileList}
          showUploadList={false}
          accept={'image/*'}
          style={{ marginBottom: 0 }}
          className={`workshop-upload`}
          disabled={uploading}
          onChange={({ fileList }) => {
            setFileList(fileList);
            if (fileList.length > 0) {
              const lastFile = fileList[fileList.length - 1];
              if (lastFile.status === 'done' && lastFile.response[0]?.url) {
                setBaseImageAsset(lastFile.response[0].url);
              }
            }
          }}
        >
          {baseImageAsset ? (
            <div className={styles.uploadImageWrapper}>
              <img src={baseImageAsset} className={styles.uploadImage} />
              <div
                className={styles.uploadText}
                onClick={(e) => {
                  if (!checkSignedIn()) {
                    e.preventDefault();
                    e.stopPropagation();
                  } else if (
                    promptInputGroupRef.current?.reversePromptLoading
                  ) {
                    e.preventDefault();
                    e.stopPropagation();
                    _message.info(
                      formatMessage({
                        id: 'workshop.config.image-to-image.upload-tip-reversing',
                      }),
                    );
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
              className={styles.uploadCard}
              style={{
                borderColor: antdToken.colorPrimary,
                color: antdToken.colorPrimary,
              }}
              onClick={(e) => {
                if (!checkSignedIn()) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
            >
              <PlusOutlined style={{ fontSize: 20, marginBottom: 6 }} />
              <div>
                {formatMessage({
                  id: 'workshop.config.image-to-image.upload',
                })}
              </div>
            </div>
          )}
        </Upload>
      </div>
      <PromptInputGroup
        ref={promptInputGroupRef}
        type={'ITI'}
        reversePrompt={() => baseImageAsset}
      />
      {messageContextHolder}
    </>
  );
});

export default ImageToImageInput;
