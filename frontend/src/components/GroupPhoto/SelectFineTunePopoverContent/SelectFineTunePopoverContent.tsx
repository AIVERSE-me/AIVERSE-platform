import styles from './SelectFineTunePopoverContent.less';
import { useCreation, useRequest } from 'ahooks';
import { getFineTunes } from '@/services/fine-tune';
import { Button, Col, message, Pagination, Row } from 'antd';
import { useIntl } from '@@/exports';
import { FineTuneModelCard } from '@/components/SelectFineTuneModelModal/FineTuneModelCard';
import React, { useState } from 'react';
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';

const pageSize = 3;

const SelectFineTunePopoverContent = ({
  onSelect,
}: {
  onSelect: (fineTuneId: string) => void;
}) => {
  const [_message, messageContextHolder] = message.useMessage();
  const { formatMessage } = useIntl();

  const [page, setPage] = useState(1);
  const offset = useCreation(() => pageSize * (page - 1), [page]);

  const { data: fineTuneModels, loading } = useRequest(async () => {
    try {
      const { finetunes } = await getFineTunes('PERSON');
      return finetunes
        .filter((e) => e.status !== 'ERROR')
        .sort(
          (a, b) =>
            new Date(b.createTime).getTime() - new Date(a.createTime).getTime(),
        );
    } catch (e) {
      console.log(e);
      _message.error(
        formatMessage({
          id: 'select-fine-tune-model-modal.get-fine-tune-failed',
        }),
      );
    }
  });

  return (
    <div style={{ width: 500 }}>
      {fineTuneModels && fineTuneModels.length > 0 ? (
        <>
          <Row gutter={12}>
            {fineTuneModels.slice(offset, offset + 3).map((e) => (
              <Col key={e.id} span={8}>
                <FineTuneModelCard
                  type={'select'}
                  fineTuneModel={e}
                  onSelect={() => onSelect(e.id)}
                />
              </Col>
            ))}
          </Row>
          <div className={styles.flexEnd}>
            <Button
              type={'primary'}
              shape={'round'}
              size={'small'}
              href={'#/features/figure'}
              icon={<PlusOutlined />}
            >
              {formatMessage({
                id: 'select-fine-tune-model-modal.go-create-model',
              })}
            </Button>
            <Pagination
              size={'small'}
              current={page}
              pageSize={3}
              total={fineTuneModels?.length || 0}
              onChange={(e) => setPage(e)}
              defaultCurrent={1}
            />
          </div>
        </>
      ) : loading ? (
        <div className={styles.emptyTip}>
          <LoadingOutlined />
        </div>
      ) : (
        <div className={styles.emptyTip}>
          <div style={{ fontSize: 30 }}>🙁</div>
          <div>
            {formatMessage({
              id: 'group-photo-model.select-fine-tune.empty-title',
            })}
          </div>
          <div>
            {formatMessage({
              id: 'group-photo-model.select-fine-tune.empty-content',
            })}
          </div>
          <Button
            style={{ marginTop: 6 }}
            type={'primary'}
            shape={'round'}
            href={'#/features/figure'}
            icon={<PlusOutlined />}
          >
            {formatMessage({
              id: 'select-fine-tune-model-modal.go-create-model',
            })}
          </Button>
        </div>
      )}

      {messageContextHolder}
    </div>
  );
};

export default SelectFineTunePopoverContent;
