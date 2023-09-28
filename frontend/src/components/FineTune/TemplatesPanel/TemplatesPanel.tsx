import styles from './TemplatesPanel.less';
import { TemplateStatistic } from '@/components/FineTune/FineTuneStatistic/FineTuneStatistic';
import { history, useIntl, useModel } from '@@/exports';
import { useRequest } from 'ahooks';
import {
  deleteMarketPersonTemplate,
  getMyMarketPersonTemplates,
} from '@/services/workshop';
import { message } from 'antd';
import { Loading } from '@/components/Icon';
import React from 'react';
import TemplateCard from '@/components/FineTune/TemplateCard/TemplateCard';
import Masonry from 'react-masonry-css';

const TemplatesPanel = () => {
  const { currentUser } = useModel('user', (state) => ({
    currentUser: state.currentUser,
  }));

  const [_message, messageContextHolder] = message.useMessage();
  const { formatMessage } = useIntl();

  const {
    data: templates,
    loading: templatesLoading,
    refreshAsync: refreshTemplates,
  } = useRequest(
    async () => {
      if (!currentUser) return;
      return await getMyMarketPersonTemplates(1, 99999);
    },
    {
      refreshDeps: [currentUser],
    },
  );

  const { runAsync: runDeleteTemplate } = useRequest(
    async (id: string) => {
      try {
        await deleteMarketPersonTemplate(id);
        refreshTemplates();
        _message.success(formatMessage({ id: 'message.delete-successful' }));
      } catch (e) {
        _message.error(formatMessage({ id: 'message.request-failed' }));
      }
    },
    { manual: true },
  );

  return (
    <div>
      <TemplateStatistic
        published={
          templates?.filter((e) => e.marketResource?.published).length || 0
        }
        used={
          templates
            ?.map((e) => e.marketUsage?.summary.count ?? 0)
            .reduce((a, b) => a + b, 0) || 0
        }
        earning={
          templates
            ?.map((e) => e.marketUsage?.summary.prices ?? 0)
            .reduce((a, b) => a + b, 0) || 0
        }
        onAdd={() => {
          history.push('/features/workshop');
        }}
      />
      {templatesLoading ? (
        <div style={{ textAlign: 'center' }}>
          <Loading />
        </div>
      ) : (
        <Masonry
          breakpointCols={4}
          className={styles.masonryGrid}
          columnClassName={styles.masonryGridColumn}
        >
          {templates?.map((e) => (
            <TemplateCard
              key={e.id}
              template={e}
              onSelect={() => {
                history.push('/features/workshop', {
                  templateId: e.id,
                });
              }}
              onDelete={() => runDeleteTemplate(e.id)}
            />
          ))}
        </Masonry>
      )}
      {messageContextHolder}
    </div>
  );
};

export default TemplatesPanel;
