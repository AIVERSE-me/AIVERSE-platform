import { useEffect, useState } from 'react';
import { AIProductMenuType } from '@/components/AIProduct/Menu/Menu';
import { useAsyncEffect, useCreation, useRequest, useThrottleFn } from 'ahooks';
import {
  createSegmentTask,
  getRunningSegmentTasks,
  getSegmentTask,
  getSegmentTaskByAsset,
} from '@/services/segment';
import useInterval from '@/hooks/useInterval';
import { blackWhiteImageToAlphaBlackImage } from '@/utils/img';
import useSegmentProgress from '@/hooks/useSegmentProgress';

const useProduct = () => {
  const [feature, setFeature] = useState<'product' | 'model'>('product');
  const [menu, setMenu] = useState<AIProductMenuType>('upload');
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [segmentTask, setSegmentTask] = useState<API.SegmentTask | undefined>(
    undefined,
  );
  const [useAIProduct, setUseAIProduct] = useState<API.AIProduct>();
  const [useAIModel, setUseAIModel] = useState<API.AIModel>();

  useEffect(() => {
    setMenu('upload');
  }, [feature]);

  const { startInterval: startSegmentTaskPolling } = useInterval(1000, {
    immediate: true,
  });

  const { segmentProgress, startSegmentProgress, stopSegmentProgress } =
    useSegmentProgress();

  const _segmentProgress = useCreation(() => {
    if (segmentTask) {
      return segmentTask.status !== 'CREATED' ? 100 : segmentProgress;
    } else {
      return 0;
    }
  }, [segmentTask, segmentProgress]);

  const { run: checkSegmentTask, loading: checkSegmentTaskLoading } =
    useRequest(
      async () => {
        const { runningSegmentTasks } = await getRunningSegmentTasks();
        if (runningSegmentTasks.length > 0) {
          setSegmentTask(runningSegmentTasks[0]);
          startSegmentProgress(
            new Date(runningSegmentTasks[0].createTime).valueOf(),
          );
          startSegmentTaskPolling(async () => {
            const { segmentTask } = await getSegmentTask(
              runningSegmentTasks[0].id,
            );
            setSegmentTask(segmentTask);
            if (segmentTask.status !== 'CREATED') {
              stopSegmentProgress();
            }
            return segmentTask.status === 'CREATED';
          });
          return true;
        }
        return false;
      },
      { manual: true },
    );

  const { runAsync: runSegmentTask, loading: runSegmentTaskLoading } =
    useRequest(
      async (asset: string) => {
        const { createSegmentTask: task } = await createSegmentTask(
          asset,
          JSON.stringify({ feature }),
        );
        startSegmentProgress(Date.now());
        setSegmentTask(task);
        setCropModalOpen(true);
        startSegmentTaskPolling(async () => {
          const { segmentTask } = await getSegmentTask(task.id);
          setSegmentTask(segmentTask);
          if (segmentTask.status !== 'CREATED') {
            stopSegmentProgress();
          }
          return segmentTask.status === 'CREATED';
        });
      },
      { manual: true },
    );

  const segmentTaskPolling = useCreation(
    () => (segmentTask ? segmentTask.status === 'CREATED' : false),
    [segmentTask],
  );

  const {
    data: layerMasks,
    loading: layerMasksLoading,
    mutate: mutateLayerMasks,
    runAsync: runLayerMasks,
  } = useRequest(
    async (layers: API.SegmentLayer[]) => {
      if (!segmentTask || layers.length === 0) return {};

      const _layerMasks: Record<string, string> = { ...layerMasks } || {};
      for (const layer of layers) {
        if (!_layerMasks[layer.id]) {
          _layerMasks[layer.id] = await blackWhiteImageToAlphaBlackImage(
            `/api/segment-tasks/${segmentTask.id}/layers/${layer.id}`,
          );
        }
      }
      return _layerMasks;
    },
    { manual: true, loadingDelay: 200 },
  );

  useAsyncEffect(async () => {
    if (feature === 'product' && useAIProduct) {
      setSegmentTask(undefined);
      const { segmentTaskByAsset } = await getSegmentTaskByAsset(
        useAIProduct.oriImg,
      );
      setSegmentTask(segmentTaskByAsset);
    } else if (feature === 'model' && useAIModel) {
      setSegmentTask(undefined);
      const { segmentTaskByAsset } = await getSegmentTaskByAsset(
        useAIModel.oriImg,
      );
      setSegmentTask(segmentTaskByAsset);
    }
  }, [useAIProduct, useAIModel]);

  return {
    feature,
    setFeature,

    menu,
    setMenu,

    cropModalOpen,
    setCropModalOpen,

    useAIModel,
    setUseAIModel,
    useAIProduct,
    setUseAIProduct,

    checkSegmentTask,
    checkSegmentTaskLoading,
    segmentTask,
    setSegmentTask,
    runSegmentTask,
    runSegmentTaskLoading,
    segmentTaskPolling,
    segmentProgress: _segmentProgress,

    layerMasks,
    layerMasksLoading,
    runLayerMasks,
    mutateLayerMasks,
  };
};

export default useProduct;
