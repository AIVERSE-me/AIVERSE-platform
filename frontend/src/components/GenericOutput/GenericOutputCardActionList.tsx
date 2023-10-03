import { GenericOutputBasicType } from '@/components/GenericOutput/GenericOutputPanel';
import { history, useIntl } from '@@/exports';
import { Modal, Tooltip } from 'antd';
import styles from '@/components/GenericOutput/OutputCard.less';
import {
  CloudDownloadOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { FourKOutlined, RepaintFilled } from '@/components/Icon';
import React from 'react';
import { useCreation } from 'ahooks';
import { isOutputInProgress } from '@/components/GenericOutput/utils';
import ICON_TEMPLATE from '@/assets/icon-template.json';
import Lottie from 'react-lottie';
import { downloadImage } from '@/utils/utils';

const ActionButton = ({
  disabled,
  onClick,
  icon,
  tooltip,
  disabledTooltip,
}: {
  disabled: boolean;
  onClick: VoidFunction;
  icon: React.ReactNode;
  tooltip: string;
  disabledTooltip?: string;
}) => {
  const { formatMessage } = useIntl();

  return (
    <div
      className={disabled ? styles.actionListBtnDisabled : styles.actionListBtn}
      onClick={() => {
        if (disabled) return;
        onClick();
      }}
    >
      <Tooltip
        placement={'right'}
        title={
          disabled
            ? disabledTooltip
              ? formatMessage({
                  id: disabledTooltip,
                })
              : ''
            : formatMessage({
                id: tooltip,
              })
        }
      >
        <div>{icon}</div>
      </Tooltip>
    </div>
  );
};

type ActionButtonProps<T> = {
  globalDisabled: boolean;
  onClick?: VoidFunction;
  data?: T;
};

function OneMoreButton<T extends GenericOutputBasicType>({
  globalDisabled,
  onClick = () => {},
}: ActionButtonProps<T>) {
  return (
    <ActionButton
      disabled={globalDisabled}
      onClick={onClick}
      tooltip={'collection.one-more'}
      icon={<ReloadOutlined />}
    />
  );
}

function DownloadButton<T extends GenericOutputBasicType>({
  globalDisabled,
  onClick = () => {},
  data,
}: ActionButtonProps<T>) {
  return (
    <ActionButton
      disabled={globalDisabled}
      onClick={() => {
        downloadImage(
          data!.hr?.imageUrls.origin || data!.imageUrls.origin,
          data!.id,
        );
      }}
      tooltip={'collection.download-image'}
      icon={<CloudDownloadOutlined />}
    />
  );
}

function HrButton<T extends GenericOutputBasicType>({
  globalDisabled,
  onClick = () => {},
  data,
}: ActionButtonProps<T>) {
  return (
    <ActionButton
      disabled={globalDisabled}
      onClick={() => {
        if (data && !data.hr) {
          onClick();
        }
      }}
      tooltip={
        data?.hr
          ? data.hr.status === 'ERROR'
            ? 'ai-product.generate.output-action.hr-error'
            : data.hr.status === 'FINISHED'
            ? 'ai-product.generate.output-action.hr-finished'
            : 'ai-product.generate.output-action.hr-progressing'
          : 'ai-product.generate.output-action.hr'
      }
      icon={<FourKOutlined />}
    />
  );
}

function DeleteButton<T extends GenericOutputBasicType>({
  globalDisabled,
  onClick = () => {},
  data,
}: ActionButtonProps<T>) {
  return (
    <ActionButton
      disabled={globalDisabled}
      onClick={onClick}
      tooltip={'collection.delete'}
      icon={<DeleteOutlined />}
    />
  );
}

function RepaintButton<T extends GenericOutputBasicType>({
  globalDisabled,
  onClick = () => {},
  data,
}: ActionButtonProps<T>) {
  return (
    <ActionButton
      disabled={globalDisabled}
      onClick={onClick}
      tooltip={'collection.repaint'}
      icon={<RepaintFilled />}
    />
  );
}

function TemplateButton<T extends GenericOutputBasicType>({
  globalDisabled,
  onClick = () => {},
  data,
}: ActionButtonProps<T>) {
  const params = (data as any)?.params;

  const templateCreated = useCreation(
    () => (data ? !!(data as any)?.personTemplate : false),
    [data],
  );

  const isImg2Img = useCreation(
    () => (params ? params.type === 'img2img' : false),
    [params],
  );

  const useStyleModels = useCreation(
    () =>
      data
        ? (data as any).usedMarketModels.filter((e) => e.type === 'STYLE')
            .length > 0
        : false,
    [data],
  );

  const usePersonModel = useCreation(
    () =>
      data
        ? (data as any).usedMarketModels.filter((e) => e.type === 'PERSON')
            .length > 0
        : false,
    [data],
  );

  return (
    <ActionButton
      disabled={globalDisabled}
      onClick={() => {
        if (!data) return;
        if (templateCreated) {
          history.push(`/features/figure`, {
            menu: 'template',
          });
        } else if (isImg2Img && !useStyleModels && usePersonModel) {
          onClick();
        }
      }}
      tooltip={
        templateCreated
          ? 'workshop.create-template-modal.view'
          : !isImg2Img
          ? 'workshop.create-template-modal.not-img2img'
          : useStyleModels
          ? 'workshop.create-template-modal.use-style-model'
          : !usePersonModel
          ? 'workshop.create-template-modal.not-use-person-model'
          : 'collection.template'
      }
      icon={
        <Lottie
          options={{
            loop: true,
            autoplay: true,
            animationData: ICON_TEMPLATE,
          }}
          isStopped={false}
          isClickToPauseDisabled={true}
          width={34}
          height={34}
        />
      }
    />
  );
}

export type GenericOutputActionType =
  | 'one-more'
  | 'download'
  | 'repaint'
  | 'hd'
  | 'template'
  | 'delete';
function GenericOutputCardActionList<T extends GenericOutputBasicType>({
  actions,
  onAction,
  output,
}: {
  actions: GenericOutputActionType[];
  onAction?: {
    onOneMore?: () => void;
    onDelete?: () => Promise<void>;
    onHr?: () => Promise<void>;
    onRepaint?: () => void;
    onTemplate?: () => void;
  };
  output?: T;
}) {
  const { onOneMore, onDelete, onHr, onRepaint, onTemplate } = onAction || {};
  const { formatMessage } = useIntl();
  const [modal, modalContextHolder] = Modal.useModal();

  const globalDisabled = useCreation(
    () => !output || isOutputInProgress(output),
    [output],
  );

  return (
    <div className={styles.actionList}>
      {actions.includes('one-more') && (
        <OneMoreButton
          onClick={onOneMore}
          globalDisabled={globalDisabled}
          data={output}
        />
      )}
      {actions.includes('download') && (
        <DownloadButton globalDisabled={globalDisabled} data={output} />
      )}
      {actions.includes('repaint') && (
        <RepaintButton
          onClick={onRepaint}
          globalDisabled={globalDisabled}
          data={output}
        />
      )}
      {actions.includes('hd') && (
        <HrButton
          onClick={onHr}
          globalDisabled={globalDisabled}
          data={output}
        />
      )}
      {actions.includes('template') && (
        <TemplateButton
          onClick={onTemplate}
          globalDisabled={globalDisabled}
          data={output}
        />
      )}
      {actions.includes('delete') && (
        <DeleteButton
          onClick={() => {
            modal.confirm({
              title: formatMessage({ id: 'collection.delete-confirm.title' }),
              content: formatMessage({
                id: 'collection.delete-confirm.content',
              }),
              okType: 'primary',
              okButtonProps: {
                danger: true,
              },
              okText: formatMessage({
                id: 'model.button.delete',
              }),
              maskClosable: true,
              centered: true,
              cancelText: formatMessage({
                id: 'model.button.cancel',
              }),
              onOk: onDelete,
            });
          }}
          globalDisabled={!output}
          data={output}
        />
      )}
      {modalContextHolder}
    </div>
  );
}

export default GenericOutputCardActionList;
