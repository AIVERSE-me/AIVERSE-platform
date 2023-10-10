import { useCreation, useMemoizedFn } from 'ahooks';
import { getTask } from '@/services/api';
import { useState } from 'react';

const useTaskPolling = ({
  interval = 2000,
  token,
}: {
  interval?: number;
  token: string;
}) => {
  const [task, setTask] = useState<API.Task | undefined>();

  const startTaskPolling = useMemoizedFn((task: API.Task) => {
    let timer: any;
    setTask(task);
    if (task.status !== 'FINISHED') {
      timer = setInterval(async () => {
        const { task: _task } = await getTask(task.id, token);
        setTask(_task);
        if (_task.status === 'FINISHED' || _task.status === 'ERROR') {
          clearInterval(timer);
        }
      }, interval);
    }
  });

  const refreshTask = useMemoizedFn(async () => {
    if (!token || !task) return;
    const { task: _task } = await getTask(task.id, token);
    setTask(_task);
  });

  const taskProcessing = useCreation(() => {
    return task && task.status !== 'FINISHED';
  }, [task]);

  return { task, setTask, startTaskPolling, refreshTask, taskProcessing };
};

export default useTaskPolling;
