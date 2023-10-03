import styles from './OutputList.less';
import { Col, Pagination, Progress, Row, theme } from 'antd';
import React, { useEffect, useState } from 'react';
import { useCreation } from 'ahooks';
import { CornerTriangle } from '@/components/CornerTriangle/CornerTriangle';
import { useIntl } from '@@/exports';
import { GenericOutputBasicType } from '@/components/GenericOutput/GenericOutputPanel';
import useInterval from '@/hooks/useInterval';
import {
  isHrInProgress,
  isOutputInProgress,
} from '@/components/GenericOutput/utils';

const GenericOutputListItem = ({
  output: _output,
  size,
  selected,
  getOutput,
}: {
  output: any;
  size: number;
  selected: boolean;
  getOutput: (id: string) => any;
}) => {
  const { formatMessage } = useIntl();
  const { token: antdToken } = theme.useToken();
  const { startInterval: startPolling } = useInterval(1000, {
    immediate: true,
  });

  const [output, setOutput] = useState<any>(_output);

  useEffect(() => {
    setOutput(_output);
    if (isOutputInProgress(_output) || isHrInProgress(_output)) {
      startPolling(async () => {
        const o = await getOutput(_output.id);
        setOutput(o);
        return isOutputInProgress(o) || isHrInProgress(o);
      });
    }
  }, [_output]);

  return (
    <div
      className={styles.card}
      style={{
        width: size,
        height: size,
        borderColor: selected ? antdToken.colorPrimary : 'transparent',
      }}
    >
      {output.hr?.status === 'FINISHED' && (
        <CornerTriangle color={'#49aa19'} size={60}>
          {formatMessage({ id: 'badge.hr' })}
        </CornerTriangle>
      )}
      {output.status === 'FINISHED' ? (
        <img className={styles.cardImage} src={`${output.imageUrls.medium}`} />
      ) : (
        <Progress
          size={64}
          type="circle"
          percent={output.progress}
          status={output?.status === 'FAILED' ? 'exception' : undefined}
        />
      )}
    </div>
  );
};

interface Props<T> {
  style?: React.CSSProperties;
  size?: number;
  data?: T[];
  total?: number;
  pagination?: any;
  selectedId?: string;
  onSelect?: (item: T) => void;
  getOutput: (id: string) => Promise<T>;
}

function GenericOutputList<T extends GenericOutputBasicType>({
  style = {},
  size = 450,
  data = [],
  total = 0,
  pagination,
  selectedId,
  onSelect = () => {},
  getOutput,
}: Props<T>) {
  const { formatMessage } = useIntl();
  const { token: antdToken } = theme.useToken();

  const _size = useCreation(() => (size - 48) / 4, [size]);

  return (
    <div
      style={{
        width: size,
        ...style,
      }}
    >
      <Row gutter={[12, 12]}>
        {data.length > 0 &&
          data.map((output) => (
            <Col key={output.id} span={6} onClick={() => onSelect(output)}>
              <GenericOutputListItem
                output={output}
                size={_size}
                selected={selectedId === output.id}
                getOutput={getOutput}
              />
            </Col>
          ))}
      </Row>

      {pagination && total > 8 && (
        <div style={{ textAlign: 'right', width: '100%', marginTop: 12 }}>
          <Pagination
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={total}
            onChange={pagination.onChange}
            onShowSizeChange={pagination.onChange}
            defaultCurrent={1}
          />
        </div>
      )}
    </div>
  );
}

export default GenericOutputList;
