import styles from './Outputs.less';
import { useInfiniteScroll, useRequest, useThrottleFn } from 'ahooks';
import Masonry from 'react-masonry-css';
import { AIProductCard } from '@/components/AIProduct/Card/Card';
import { useEffect, useState } from 'react';
import ImagePreviewModal from '@/components/ImageModal/ImagePreviewModal';
import {
  deleteAIModelOutput,
  deleteAIProductOutput,
  getAIModelOutputs,
  getAIProductOutputs,
} from '@/services/ai-product';
import { message } from 'antd';
import { useIntl } from '@@/exports';
import { Loading } from '@/components/Icon';

const PAGE_SIZE = 16;

export const AIProductOutputs = ({ type }: { type: 'product' | 'model' }) => {
  const [_message, messageContextHolder] = message.useMessage();
  const { formatMessage } = useIntl();

  const [previewImage, setPreviewImage] = useState('');

  const {
    data,
    mutate,
    noMore,
    loading: loadingData,
    loadMore,
  } = useInfiniteScroll(
    async (d) => {
      const page = d ? Math.ceil(d.list.length / PAGE_SIZE) + 1 : 1;
      if (type === 'product') {
        const { aiProductOutputs } = await getAIProductOutputs({
          page,
          pageSize: PAGE_SIZE,
        });
        return {
          list: aiProductOutputs,
          hasMore: aiProductOutputs.length === PAGE_SIZE,
        };
      } else {
        const { aiModelOutputs } = await getAIModelOutputs({
          page,
          pageSize: PAGE_SIZE,
        });
        return {
          list: aiModelOutputs,
          hasMore: aiModelOutputs.length === PAGE_SIZE,
        };
      }
    },
    {
      isNoMore: (data) => {
        return data ? !data.hasMore : false;
      },
      // target: document.body,
    },
  );

  const { run: onScroll } = useThrottleFn(
    () => {
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 2
      ) {
        if (!noMore && !loadingData) {
          loadMore();
        }
      }
    },
    { wait: 200, leading: true },
  );

  useEffect(() => {
    window.addEventListener('scroll', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const { runAsync: runDeleteOutput } = useRequest(
    async (id: string) => {
      try {
        const func =
          type === 'product' ? deleteAIProductOutput : deleteAIModelOutput;
        await func(id);
        const index = data!.list.findIndex((e) => e.id === id);
        data!.list.splice(index, 1);
        mutate({ ...data! });
        _message.success(
          formatMessage({
            id: 'ai-product.generate.output-action.delete.done',
          }),
        );
      } catch (e) {
        console.log(e);
        _message.error(
          formatMessage({
            id: 'ai-product.generate.output-action.delete.failed',
          }),
        );
      }
    },
    { manual: true },
  );

  return (
    <>
      <Masonry
        breakpointCols={4}
        className={styles.masonryGrid}
        columnClassName={styles.masonryGridColumn}
      >
        {data?.list.map((e) => (
          <AIProductCard
            key={e.id}
            id={e.id}
            type={'output'}
            outputType={type}
            output={e}
            handlers={{
              onView: (url: string) => setPreviewImage(url),
              onDelete: () => runDeleteOutput(e.id),
            }}
          />
        ))}
      </Masonry>
      {loadingData && (
        <div className={styles.loading}>
          <Loading />
        </div>
      )}
      {!loadingData && data?.list.length === 0 && (
        <div className={styles.emptyTip}>
          {formatMessage({ id: 'ai-product.output.empty-tip' })}
        </div>
      )}

      <ImagePreviewModal
        size={800}
        image={previewImage}
        onClose={() => setPreviewImage('')}
      />
      {messageContextHolder}
    </>
  );
};
