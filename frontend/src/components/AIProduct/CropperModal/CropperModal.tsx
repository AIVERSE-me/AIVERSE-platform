import { Col, message, Modal, Row, Spin, theme } from 'antd';
import { request, useIntl, useModel } from '@@/exports';
import ReactCrop, { type Crop } from 'react-image-crop';
import { useEffect, useState } from 'react';
import styles from './CropperModal.less';
import 'react-image-crop/dist/ReactCrop.css';
import {
  Bounding,
  euclideanDistance,
} from '@/components/AIProduct/CropperModal/utils';
import { LoadingOutlined } from '@ant-design/icons';
import { useCreation, useRequest } from 'ahooks';
import { mixOriginImageWithMaskImage } from '@/utils/img';
import { createAIModel, createAIProduct } from '@/services/ai-product';

export const CropperModal = ({ type }: { type: 'product' | 'model' }) => {
  const { token } = useModel('user', (state) => ({
    token: state.token,
  }));
  const {
    segmentTask,
    segmentTaskPolling,
    segmentProgress,
    layerMasks,
    layerMasksLoading,
    runLayerMasks,
    cropModalOpen,
    setCropModalOpen,
    setUseAIProduct,
    setUseAIModel,
    setMenu,
  } = useModel('product', (state) => ({
    segmentTask: state.segmentTask,
    segmentTaskPolling: state.segmentTaskPolling,
    segmentProgress: state.segmentProgress,
    layerMasks: state.layerMasks,
    layerMasksLoading: state.layerMasksLoading,
    runLayerMasks: state.runLayerMasks,
    cropModalOpen: state.cropModalOpen,
    setCropModalOpen: state.setCropModalOpen,
    setUseAIProduct: state.setUseAIProduct,
    setUseAIModel: state.setUseAIModel,
    setMenu: state.setMenu,
  }));
  const [_message, messageContextHolder] = message.useMessage();
  const { formatMessage } = useIntl();
  const { token: antdToken } = theme.useToken();

  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 50,
    height: 50,
    x: 25,
    y: 25,
  });
  const [percentCrop, setPercentCop] = useState<Crop | undefined>(undefined);
  const [imageSize, setImageSize] = useState<{ width: number; height: number }>(
    { width: 0, height: 0 },
  );
  const [imageActualSize, setImageActualSize] = useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });
  const [bounding, setBounding] = useState<Bounding | undefined>(undefined);
  const [layerId, setLayerId] = useState<number>(0);

  useEffect(() => {
    if (imageSize) {
      const { x, y, width, height } = percentCrop || {
        unit: '%',
        width: 50,
        height: 50,
        x: 25,
        y: 25,
      };
      const bounding = {
        x0: (x * imageSize.width) / 100,
        y0: (y * imageSize.height) / 100,
        width: (width * imageSize.width) / 100,
        height: (height * imageSize.height) / 100,
      };
      setBounding(bounding);
    }
  }, [percentCrop, imageSize]);

  const sortedSegments = useCreation(() => {
    if (!segmentTask || segmentTask.status !== 'FINISHED' || !bounding)
      return [];

    const distances: number[] = segmentTask.layers.map((r: any) => {
      return euclideanDistance(
        {
          x0: r.bbox_x0,
          y0: r.bbox_y0,
          width: r.bbox_w,
          height: r.bbox_h,
        },
        bounding,
      );
    });
    const sortedIndexes = distances
      .map((d, i) => [d, i])
      .sort(([a], [b]) => a - b)
      .map(([_, i]) => i);
    setLayerId(segmentTask.layers[sortedIndexes[0]].id);
    return sortedIndexes.map((i) => segmentTask.layers[i]);
  }, [segmentTask, bounding]);

  useEffect(() => {
    runLayerMasks(sortedSegments.slice(0, 5));
  }, [sortedSegments]);

  useEffect(() => {
    if (!open) {
      setBounding(undefined);
      setPercentCop(undefined);
      setImageSize({ width: 0, height: 0 });
      setImageActualSize({ width: 0, height: 0 });
      setCrop({
        unit: '%',
        width: 50,
        height: 50,
        x: 25,
        y: 25,
      });
      // mutateSegment(undefined);
    }
  }, [open]);

  const { runAsync: runCreateAIProduct, loading: createAIProductLoading } =
    useRequest(
      async () => {
        try {
          const oriAssetId = segmentTask.asset;
          const layer = segmentTask.layers.find(
            (e: API.SegmentLayer) => e.id === layerId,
          );
          const maskedImageBlob = await mixOriginImageWithMaskImage(
            `/api/assets/${oriAssetId}`,
            `/api/segment-tasks/${segmentTask.id}/layers/${layer.id}`,
          );
          if (!maskedImageBlob) return;

          const formData = new FormData();
          formData.append(
            'files',
            maskedImageBlob,
            `${segmentTask.id}_${Date.now()}.png`,
          );
          const [{ asset: maskedOriAssetId }] = await request(
            '/api/ai-product/images',
            {
              method: 'POST',
              data: formData,
              headers: { authorization: `Bearer ${token}` },
            },
          );
          const params = {
            layerId: layer.id,
            maskedOriAssetId,
            oriAssetId,
            segmentTaskId: segmentTask.id,
          };
          if (type === 'product') {
            const { createAiProductFromSegmentTaskLayer: aiProduct } =
              await createAIProduct(params);
            setUseAIProduct(aiProduct);
            return aiProduct;
          } else {
            const { createAiModelFromSegmentTaskLayer: aiModel } =
              await createAIModel(params);
            setUseAIModel(aiModel);
            return aiModel;
          }
        } catch (e) {
          console.log(e);
          _message.error(
            formatMessage({
              id: 'ai-product.cropper-modal.create-product-failed',
            }),
          );
        }
      },
      { manual: true },
    );

  // useEffect(() => {
  //   if (cropModalOpen && segmentTask && !layerMasks) {
  //     runLayerMasks();
  //   }
  // }, [segmentTask, cropModalOpen, layerMasks]);

  return (
    <Modal
      centered={true}
      open={cropModalOpen}
      onCancel={() => {
        if (!segmentTaskPolling && !createAIProductLoading) {
          setCropModalOpen(false);
        }
      }}
      onOk={async () => {
        const product = await runCreateAIProduct();
        if (product) {
          setCropModalOpen(false);
          setMenu('generate');
        }
      }}
      okButtonProps={{
        disabled: sortedSegments.length === 0 || layerMasksLoading,
        loading: createAIProductLoading,
      }}
      cancelButtonProps={{
        disabled:
          segmentTaskPolling || createAIProductLoading || layerMasksLoading,
      }}
      maskClosable={false}
      title={formatMessage({
        id: 'ai-product.cropper-modal.title',
      })}
      width={1000}
    >
      {!layerMasks ||
      !segmentTask ||
      segmentTaskPolling ||
      segmentTask.statue === 'FAILED' ? (
        <div className={styles.loading}>
          <LoadingOutlined style={{ fontSize: 40, marginBottom: 12 }} />
          <div>
            {formatMessage(
              { id: 'ai-product.cropper-modal.loading-progress' },
              {
                progress: Math.floor(segmentProgress),
              },
            )}
          </div>
        </div>
      ) : (
        <div className={styles.row}>
          <div className={styles.step1}>
            <div className={styles.tip}>
              {formatMessage({ id: 'ai-product.cropper-modal.step-1' })}
            </div>
            <ReactCrop
              crop={crop}
              onChange={(c) => {
                if (c.width !== 0 && c.height !== 0) {
                  setCrop(c);
                }
              }}
              onComplete={(_, pc) => {
                setPercentCop(pc);
              }}
              style={{ display: 'block', borderRadius: 8 }}
            >
              <img
                src={`/api/assets/${segmentTask.asset}`}
                onLoad={(e) => {
                  const { naturalWidth, naturalHeight, width, height } =
                    e.target as any;
                  setImageSize({
                    width: naturalWidth,
                    height: naturalHeight,
                  });
                  setImageActualSize({
                    width,
                    height,
                  });
                }}
              />
            </ReactCrop>
          </div>
          <div className={styles.step2}>
            <Spin
              spinning={layerMasksLoading}
              tip={formatMessage({
                id: 'ai-product.cropper-modal.loading',
              })}
            >
              <div className={styles.tip}>
                {formatMessage({ id: 'ai-product.cropper-modal.step-2' })}
              </div>
              {layerMasks[layerId] ? (
                <img
                  className={styles.selectedSegmentImage}
                  src={`/api/assets/${segmentTask.asset}`}
                  style={{
                    maskImage: layerMasks[layerId],
                    WebkitMaskImage: `url(${layerMasks[layerId]})`,
                    width: imageActualSize.width,
                    height: imageActualSize.height,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: imageActualSize.width,
                    height: imageActualSize.height,
                  }}
                />
              )}
              {sortedSegments.length > 0 && layerMasks && (
                <Row style={{ marginTop: 12 }} gutter={12}>
                  {sortedSegments.slice(0, 5).map((e) => (
                    <Col flex={'20%'} key={e.id}>
                      <div
                        className={styles.segmentImageContainer}
                        style={{
                          borderColor:
                            layerId === e.id
                              ? antdToken.colorPrimary
                              : 'transparent',
                        }}
                      >
                        <img
                          onClick={() => setLayerId(e.id)}
                          src={`/api/assets/${segmentTask.asset}`}
                          className={styles.segmentImage}
                          style={{
                            maskImage: `url(${layerMasks[e.id]})`,
                            WebkitMaskImage: `url(${layerMasks[e.id]})`,
                          }}
                        />
                      </div>
                    </Col>
                  ))}
                </Row>
              )}
            </Spin>
          </div>
        </div>
      )}
      {messageContextHolder}
    </Modal>
  );
};
