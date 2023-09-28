import { Button, Card, Col, Row, Statistic } from 'antd';
import { useIntl } from '@@/exports';

const FineTuneStatistic = ({
  title,
  value,
  suffix,
}: {
  title: string;
  value: number;
  suffix?: React.ReactNode;
}) => {
  return (
    <Card bordered={false}>
      <Statistic
        valueStyle={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
        title={title}
        value={value}
        suffix={suffix}
      />
    </Card>
  );
};

export const ModelStatistic = ({
  total,
  published,
  used,
  earning,
  onCreate,
}: {
  total: number;
  published: number;
  used: number;
  earning: number;
  onCreate: VoidFunction;
}) => {
  const { formatMessage } = useIntl();

  return (
    <Row gutter={24} style={{ marginBottom: 24 }}>
      <Col span={6}>
        <FineTuneStatistic
          title={formatMessage({
            id: 'fine-tune.statistic.fine-tunes',
          })}
          value={total}
          suffix={
            <Button
              type={'primary'}
              shape={'round'}
              style={{ display: 'block' }}
              onClick={onCreate}
            >
              {formatMessage({ id: 'fine-tune.menu.create' })}
            </Button>
          }
        />
      </Col>
      <Col span={6}>
        <FineTuneStatistic
          title={formatMessage({
            id: 'fine-tune.statistic.fine-tunes-published',
          })}
          value={published}
        />
      </Col>
      <Col span={6}>
        <FineTuneStatistic
          title={formatMessage({
            id: 'fine-tune.statistic.fine-tunes-used',
          })}
          value={used}
        />
      </Col>
      <Col span={6}>
        <FineTuneStatistic
          title={formatMessage({
            id: 'fine-tune.statistic.fine-tunes-earning',
          })}
          value={earning}
        />
      </Col>
    </Row>
  );
};

export const TemplateStatistic = ({
  published,
  used,
  earning,
  onAdd,
}: {
  published: number;
  used: number;
  earning: number;
  onAdd: VoidFunction;
}) => {
  const { formatMessage } = useIntl();

  return (
    <Row gutter={24} style={{ marginBottom: 24 }}>
      <Col span={6}>
        <FineTuneStatistic
          title={formatMessage({
            id: 'fine-tune.statistic.templates-published',
          })}
          value={published}
          suffix={
            <Button
              type={'primary'}
              shape={'round'}
              style={{ display: 'block' }}
              onClick={onAdd}
            >
              {formatMessage({ id: 'fine-tune.menu.add-template' })}
            </Button>
          }
        />
      </Col>
      <Col span={6}>
        <FineTuneStatistic
          title={formatMessage({
            id: 'fine-tune.statistic.templates-used',
          })}
          value={used}
        />
      </Col>
      <Col span={6}>
        <FineTuneStatistic
          title={formatMessage({
            id: 'fine-tune.statistic.templates-earning',
          })}
          value={earning}
        />
      </Col>
    </Row>
  );
};
