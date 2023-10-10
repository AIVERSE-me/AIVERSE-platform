import { useMemoizedFn } from 'ahooks';
import { useEffect, useState } from 'react';

const useSegmentProgress = () => {
  const [segmentProgress, setSegmentProgress] = useState(0);
  const [timer, setTimer] = useState<NodeJS.Timer | undefined>(undefined);

  const startSegmentProgress = useMemoizedFn((startAt: number) => {
    if (timer) {
      clearInterval(timer);
      setTimer(undefined);
    }
    setSegmentProgress(0);
    const timer = setInterval(() => {
      let deltaTime = Date.now() - startAt;
      deltaTime = deltaTime <= 0 ? 0 : deltaTime;
      deltaTime = deltaTime / 1000;
      setSegmentProgress((-1 / (0.5 * deltaTime + 1) + 1) * 100);
    }, 1000);
    setTimer(timer);
  });

  const stopSegmentProgress = useMemoizedFn(() => {
    if (timer) {
      clearInterval(timer);
      setTimer(undefined);
    }
    setSegmentProgress(0);
  });

  useEffect(() => {
    return () => {
      if (timer) {
        clearInterval(timer);
        setTimer(undefined);
      }
      setSegmentProgress(0);
    };
  }, []);

  return {
    segmentProgress,
    startSegmentProgress,
    stopSegmentProgress,
  };
};

export default useSegmentProgress;
