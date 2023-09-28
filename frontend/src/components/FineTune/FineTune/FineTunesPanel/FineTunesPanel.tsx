import styles from './FineTunesPanel.less';
import { useIntl, useModel } from '@@/exports';
import { ModelStatistic } from '@/components/FineTune/FineTuneStatistic/FineTuneStatistic';
import { useRequest } from 'ahooks';
import { getFineTunes } from '@/services/fine-tune';
import { message } from 'antd';
import FineTuneCard from '@/components/FineTune/FineTuneCard/FineTuneCard';
import React, { useState } from 'react';
import FineTuneModelTab from '@/components/FineTune/FineTuneModelTab/FineTuneModelTab';
import PublishModelModal from '@/components/workshop/Modal/PublichModelModal';
import { deletePrivateModel } from '@/services/workshop';
import { Loading } from '@/components/Icon';
import Masonry from 'react-masonry-css';

const FineTunesPanel = ({
  type,
  onCreate,
}: {
  type: API.FineTuneType;
  onCreate: VoidFunction;
}) => {
  const { currentUser } = useModel('user', (state) => ({
    currentUser: state.currentUser,
  }));

  const [_message, messageContextHolder] = message.useMessage();
  const { formatMessage } = useIntl();
  const [fineTuneId, setFineTuneId] = useState<string>();
  const [publishFineTune, setPublishFineTune] = useState<API.FineTune>();

  const {
    data: fineTuneModels,
    loading: fineTuneModelsLoading,
    refreshAsync: refreshFineTuneModels,
  } = useRequest(
    async () => {
      if (!currentUser) return;
      const { finetunes } = await getFineTunes(type);
      return finetunes
        ? finetunes.sort(
            (a, b) =>
              new Date(b.createTime).getTime() -
              new Date(a.createTime).getTime(),
          )
        : [];
    },
    {
      refreshDeps: [currentUser],
    },
  );

  const { runAsync: runDeleteFineTune } = useRequest(
    async (id: string) => {
      try {
        await deletePrivateModel(id);
        refreshFineTuneModels();
        _message.success(formatMessage({ id: 'message.delete-successful' }));
      } catch (e) {
        _message.error(formatMessage({ id: 'message.request-failed' }));
      }
    },
    {
      manual: true,
    },
  );

  return fineTuneId ? (
    <FineTuneModelTab
      key={fineTuneId}
      modelId={fineTuneId}
      onClose={() => setFineTuneId(undefined)}
    />
  ) : (
    <div>
      <ModelStatistic
        total={fineTuneModels?.length || 0}
        published={
          fineTuneModels?.filter((e) => e.marketResource?.published).length || 0
        }
        used={
          fineTuneModels
            ?.map((e) => e.marketUsage?.summary.count ?? 0)
            .reduce((a, b) => a + b, 0) || 0
        }
        earning={
          fineTuneModels
            ?.map((e) => e.marketUsage?.summary.prices ?? 0)
            .reduce((a, b) => a + b, 0) || 0
        }
        onCreate={onCreate}
      />
      {fineTuneModelsLoading ? (
        <div style={{ textAlign: 'center' }}>
          <Loading />
        </div>
      ) : (
        <Masonry
          breakpointCols={4}
          className={styles.masonryGrid}
          columnClassName={styles.masonryGridColumn}
        >
          {fineTuneModels?.map((e) => (
            <FineTuneCard
              key={e.id}
              fineTune={e}
              onSelect={() => setFineTuneId(e.id)}
              onDelete={async () => {
                await runDeleteFineTune(e.id);
              }}
              onReview={() => setPublishFineTune(e)}
              // onRefresh={refreshFineTuneModels}
            />
          ))}
        </Masonry>
      )}
      {messageContextHolder}
      <PublishModelModal
        fineTune={publishFineTune}
        open={!!publishFineTune}
        onCancel={() => setPublishFineTune(undefined)}
        onPublish={() => {
          setPublishFineTune(undefined);
          refreshFineTuneModels();
        }}
      />
    </div>
  );
};

export default FineTunesPanel;
