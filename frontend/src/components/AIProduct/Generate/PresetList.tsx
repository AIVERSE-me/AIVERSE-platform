import { Col, Pagination, Row, theme } from 'antd';
import styles from '@/components/AIProduct/Generate/Generate.less';
import { PlusOutlined } from '@ant-design/icons';
import { useIntl } from '@@/exports';
import { useState } from 'react';
import { useCreation } from 'ahooks';

const PAGE_SIZE = 6;

export const PresetList = ({
  data,
  value,
  onChange,
  onAdd = () => {},
}: {
  data: {
    id: string;
    value: string;
    image: string;
    type: string;
  }[];
  value: string;
  onChange: (e: { id: string; value: string; type: string }) => void;
  onAdd?: VoidFunction;
}) => {
  const { formatMessage } = useIntl();
  const { token: antdToken } = theme.useToken();

  const [page, setPage] = useState(1);

  const offset = useCreation(() => (page - 1) * PAGE_SIZE, [page]);

  return (
    <div>
      <Row gutter={[8, 8]} style={{ marginBottom: 8 }}>
        {data.slice(offset, offset + PAGE_SIZE).map((e) => (
          <Col key={e.id} span={8}>
            <div className={styles.presetCard}>
              {e.type === 'add' ? (
                <div
                  onClick={onAdd}
                  className={styles.addUserLoraCard}
                  style={{
                    borderColor: antdToken.colorPrimary,
                    color: antdToken.colorPrimary,
                  }}
                >
                  <PlusOutlined style={{ fontSize: 18 }} />
                  <div>
                    {formatMessage({
                      id: 'ai-product.fine-tune.add-fine-tune',
                    })}
                  </div>
                </div>
              ) : e.image ? (
                <img
                  onClick={() => onChange(e)}
                  className={styles.absolutePresetImage}
                  style={{
                    borderColor:
                      value === e.id ? antdToken.colorPrimary : 'transparent',
                  }}
                  src={e.image}
                />
              ) : (
                <div
                  onClick={() => onChange(e)}
                  className={styles.absolutePresetImage}
                  style={{
                    borderColor:
                      value === e.id ? antdToken.colorPrimary : 'transparent',
                  }}
                >
                  {e.value}
                </div>
              )}
            </div>
          </Col>
        ))}
      </Row>
      <Pagination
        style={{ textAlign: 'right' }}
        size="small"
        pageSize={PAGE_SIZE}
        current={page}
        onChange={(page) => setPage(page)}
        total={data.length}
      />
    </div>
  );
};
