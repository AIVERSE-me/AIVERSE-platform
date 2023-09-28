import { useEffect, useState } from 'react';
import { useDebounceFn } from 'ahooks';

const useInterval = (delay: number, options: { immediate: boolean }) => {
  const [timer, setTimer] = useState<NodeJS.Timer | undefined>(undefined);

  const { run: stopInterval } = useDebounceFn(
    () => {
      if (timer) {
        clearInterval(timer);
        setTimer(undefined);
      }
    },
    {
      wait: 500,
      leading: true,
    },
  );

  const { run: startInterval } = useDebounceFn(
    async (fn: () => Promise<boolean>) => {
      if (timer) {
        clearInterval(timer);
        setTimer(undefined);
      }
      setTimer(
        setInterval(async () => {
          try {
            const shouldInterval = await fn();
            if (!shouldInterval) {
              stopInterval();
            }
          } catch (e) {}
        }, delay),
      );
      if (options.immediate) {
        try {
          const shouldInterval = await fn();
          if (!shouldInterval) return;
        } catch (e) {}
      }
    },
    {
      wait: 500,
    },
  );

  useEffect(() => {
    return () => {
      stopInterval();
    };
  }, []);

  return {
    polling: !!timer,
    startInterval,
    stopInterval,
  };
};

export default useInterval;
