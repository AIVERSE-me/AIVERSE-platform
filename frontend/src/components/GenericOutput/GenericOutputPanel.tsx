import styles from './OutputPanel.less';
import GenericOutputCard, {
  GenericOutputCardRefs,
} from '@/components/GenericOutput/GenericOutputCard';
import GenericOutputList from '@/components/GenericOutput/GenericOutputList';
import React, {
  ForwardedRef,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { useLocation, useModel } from '@@/exports';
import { usePagination } from 'ahooks';
import { GenericOutputActionType } from '@/components/GenericOutput/GenericOutputCardActionList';

export interface GenericOutputBasicType {
  id: string;
  imageUrls: API.ImageUrls;
  hr?: API.HrTask;
  status: API.ImageGenerateStatus;
  error: string;
  progress: number;
}

export interface GenericOutputPanelRefs {
  refreshOutput: () => void;
  refreshOutputs: () => void;
}

export interface GenericOutputServices<T> {
  getOutputs: (
    page: number,
    pageSize: number,
  ) => Promise<{ total: number; list: T[] }>;
  getOutput: (id: string) => Promise<T>;
  deleteOutput: (id: string) => Promise<void>;
  createHrTask: (id: string) => Promise<void>;
}

interface GenericOutputPanelProps<T> {
  size?: number;
  onSelect?: (item: T) => void;
  services: GenericOutputServices<T>;
  actions: GenericOutputActionType[];
  handlers?: {
    onOneMore?: (item: any) => void;
    onDelete?: (id: string) => Promise<void>;
    onHr?: (id: string) => Promise<void>;
    onRepaint?: (item: any) => void;
    onTemplate?: (item: any) => void;
  };
}
function GenericOutputPanel<T extends GenericOutputBasicType>(
  {
    size = 450,
    onSelect = () => {},
    services,
    actions,
    handlers,
  }: GenericOutputPanelProps<T>,
  ref: ForwardedRef<GenericOutputPanelRefs>,
) {
  const { currentUser } = useModel('user', (state) => ({
    currentUser: state.currentUser,
  }));

  const outputCardRef = useRef<GenericOutputCardRefs>(null);

  const { state } = useLocation();

  const [currentOutputId, setCurrentOutputId] = useState<string>('');

  useEffect(() => {
    setCurrentOutputId('');
  }, [currentUser]);

  useEffect(() => {
    if ((state as any)?.output) {
      setCurrentOutputId((state as any).output.id);
    }
  }, [state]);

  const {
    data: outputs,
    refresh: refreshOutputs,
    runAsync: runOutputs,
    pagination,
  } = usePagination(
    async (
      { current, pageSize }: { current: number; pageSize: number },
      reset = false,
    ) => {
      if (!currentUser) return { list: [], total: 0 };

      let { total, list } = await services.getOutputs(current, pageSize);

      if (
        !(state as any)?.output &&
        list.length > 0 &&
        (!currentOutputId || reset)
      ) {
        setCurrentOutputId(list[0].id);
      }

      return {
        total,
        list,
      };
    },
    {
      refreshDeps: [currentUser],
      defaultPageSize: 8,
      defaultCurrent: 1,
    },
  );

  useImperativeHandle(ref, () => ({
    refreshOutput: () => outputCardRef.current?.refresh(),
    refreshOutputs: () => {
      setCurrentOutputId('');
      runOutputs({ current: 1, pageSize: 8 }, true);
    },
  }));

  return (
    <div>
      <GenericOutputCard
        ref={outputCardRef}
        outputId={currentOutputId}
        size={size}
        style={{ marginBottom: 24 }}
        services={services}
        actions={actions}
        handlers={{
          onOneMore: (item) => {
            handlers?.onOneMore?.(item);
          },
          onDelete: async (id) => {
            handlers?.onDelete?.(id);
            refreshOutputs();
          },
          onHr: async (id) => {
            handlers?.onHr?.(id);
            refreshOutputs();
          },
          onRepaint: (output) => {
            handlers?.onRepaint?.(output);
          },
          onTemplate: (output) => {
            handlers?.onTemplate?.(output);
          },
        }}
      />
      <GenericOutputList<T>
        size={size}
        pagination={pagination}
        data={outputs?.list}
        total={outputs?.total}
        selectedId={currentOutputId}
        onSelect={(item) => {
          setCurrentOutputId(item.id);
          onSelect(item);
        }}
        getOutput={services.getOutput}
      />
    </div>
  );
}
export default forwardRef(GenericOutputPanel);
