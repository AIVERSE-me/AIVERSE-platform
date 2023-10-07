import styles from './ProductHistory.less';
import { useInfiniteScroll, useRequest, useThrottleFn } from 'ahooks';
import {
  deleteAIModel,
  deleteAIProduct,
  getAIModels,
  getAIProducts,
} from '@/services/ai-product';
import { AIProductCard } from '@/components/AIProduct/Card/Card';
import Masonry from 'react-masonry-css';
import ImagePreviewModal from '@/components/ImageModal/ImagePreviewModal';
import { useEffect, useState } from 'react';
import { useIntl, useModel } from '@@/exports';
import { message } from 'antd';
import { Loading } from '@/components/Icon';

const PAGE_SIZE = 16;

export const AIProductHistory = ({ type }: { type: 'product' | 'model' }) => {
  const { setUseAIProduct, setUseAIModel, setMenu, mutateLayerMasks } =
    useModel('product', (state) => ({
      setUseAIProduct: state.setUseAIProduct,
      setUseAIModel: state.setUseAIModel,
      setMenu: state.setMenu,
      mutateLayerMasks: state.mutateLayerMasks,
    }));
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
        const { aiProducts } = await getAIProducts(page, PAGE_SIZE);
        return {
          list: aiProducts,
          hasMore: aiProducts.length === PAGE_SIZE,
        };
      } else {
        const { aiModels } = await getAIModels(page, PAGE_SIZE);
        return {
          list: aiModels,
          hasMore: aiModels.length === PAGE_SIZE,
        };
      }
    },
    {
      isNoMore: (data) => {
        return data ? !data.hasMore : false;
      },
      // target: document,
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

  const { runAsync: runDeleteProduct } = useRequest(
    async (id: string) => {
      try {
        const func = type === 'product' ? deleteAIProduct : deleteAIModel;
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
    {
      manual: true,
    },
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
            type={'product'}
            productImage={e.maskedOriImgUrl}
            handlers={{
              onView: () => setPreviewImage(e.maskedOriImgUrl),
              onDelete: () => runDeleteProduct(e.id),
              onUseProduct: () => {
                mutateLayerMasks({});
                if (type === 'product') {
                  setUseAIProduct(e);
                } else {
                  setUseAIModel(e);
                }
                setMenu('generate');
              },
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
          {formatMessage({ id: 'ai-product.product.empty-tip' })}
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
