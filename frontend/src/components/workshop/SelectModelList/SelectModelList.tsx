import { forwardRef, useContext, useState } from 'react';
import { useIntl, useModel, history } from '@@/exports';
import { ThemeTabs } from '@/components/Tabs/Tabs';
import { Col, Pagination, Row, theme, Tooltip } from 'antd';
import { useCreation, useRequest } from 'ahooks';
import styles from './SelectModelList.less';
import { GlobalContext, GlobalContextType } from '@/layouts';
import { getFineTunes } from '@/services/fine-tune';
import classNames from 'classnames';
import { publicMarketPrivateModels } from '@/services/workshop';
import { PlusOutlined } from '@ant-design/icons';
import { getMarketResourcePrice } from '@/components/workshop/utils';

export const PublicModelList = ({
  type,
  selectedModel = '',
  onSelect,
  pageSize,
}: {
  type: API.FineTuneType;
  selectedModel?: string | string[];
  onSelect: (token: string, fineTune: API.FineTune) => void;
  pageSize: number;
}) => {
  const { formatMessage } = useIntl();
  const { token: antdToken } = theme.useToken();

  const [page, setPage] = useState(1);

  const {
    data: publicModels = {
      list: [],
      total: 0,
    },
  } = useRequest(
    async () => {
      const res = await publicMarketPrivateModels(type, page, pageSize);
      return {
        list: res.publicMarketPrivateModels,
        total: res.publicMarketPrivateModelsCount,
      };
    },
    {
      refreshDeps: [page],
    },
  );

  return (
    <>
      <Row gutter={[12, 12]}>
        {publicModels?.list.map((e: API.FineTune) => (
          <Col key={e.id} flex={`${(100 / pageSize) * 2}%`}>
            <Tooltip title={e.index.displayName}>
              <div
                className={styles.fineTuneCard}
                style={{
                  borderColor: (
                    Array.isArray(selectedModel)
                      ? selectedModel.includes(e.uniqueToken)
                      : selectedModel === e.uniqueToken
                  )
                    ? antdToken.colorPrimary
                    : 'transparent',
                }}
                onClick={() => {
                  onSelect(e.uniqueToken, e);
                }}
              >
                <img src={e.inputImages[0]} className={styles.fineTuneCover} />
                {e.marketResource && (
                  <div
                    className={classNames(styles.priceMask, {
                      [styles.free]:
                        getMarketResourcePrice(e.marketResource) === 0,
                    })}
                  >
                    {e.marketResource.free
                      ? formatMessage({ id: 'workshop.price-free' })
                      : new Date(e.marketResource.freeEnd).getTime() >=
                        Date.now()
                      ? formatMessage({ id: 'workshop.price-limited-free' })
                      : formatMessage(
                          { id: 'workshop.price' },
                          { price: e.marketResource.price },
                        )}
                  </div>
                )}
              </div>
            </Tooltip>
          </Col>
        ))}
      </Row>
      <Pagination
        style={{ textAlign: 'right' }}
        size="small"
        current={page}
        pageSize={pageSize}
        total={publicModels?.list.length || 0}
        onChange={setPage}
      />
    </>
  );
};

export const PrivateModelList = ({
  type,
  selectedModel = '',
  onSelect,
  pageSize,
}: {
  type: API.FineTuneType;
  selectedModel?: string | string[];
  onSelect: (token: string, fineTune: API.FineTune) => void;
  pageSize: number;
}) => {
  const { currentUser } = useModel('user', (state) => ({
    currentUser: state.currentUser,
  }));
  const { formatMessage } = useIntl();
  const { token: antdToken } = theme.useToken();

  const [page, setPage] = useState(1);
  const privateOffset = useCreation(() => (page - 1) * pageSize, [page]);

  const { data: privateModels = [], loading: privateModelsLoading } =
    useRequest(
      async () => {
        console.log('currentUser', currentUser);
        if (!currentUser) return [];
        const { finetunes } = await getFineTunes(type);
        console.log('finetunes', finetunes);
        return finetunes
          ? [
              null,
              ...finetunes
                .filter((e) => e.status === 'FINISHED')
                .sort(
                  (a, b) =>
                    new Date(b.createTime).getTime() -
                    new Date(a.createTime).getTime(),
                ),
            ]
          : [null];
      },
      {
        refreshDeps: [currentUser],
      },
    );
  console.log('privateModels', type, privateModels);
  return (
    <>
      <Row gutter={[12, 12]}>
        {privateModels.slice(privateOffset, privateOffset + pageSize).map((e) =>
          !e ? (
            <Col key={`private-${type}-add`} flex={`${(100 / pageSize) * 2}%`}>
              <div
                onClick={() => {
                  history.push(
                    `/features/${type === 'PERSON' ? 'figure' : 'style-model'}`,
                  );
                }}
                className={styles.fineTuneCard}
                style={{
                  borderColor: antdToken.colorPrimary,
                  borderStyle: 'dashed',
                }}
              >
                <div
                  className={styles.fineTuneAdd}
                  style={{ color: antdToken.colorPrimary }}
                >
                  <PlusOutlined style={{ fontSize: 20 }} />
                  {formatMessage({
                    id: `fine-tune.create-${type.toLowerCase()}`,
                  })}
                </div>
              </div>
            </Col>
          ) : (
            <Col key={e.id} flex={`${(100 / pageSize) * 2}%`}>
              <div
                className={styles.fineTuneCard}
                style={{
                  borderColor: (
                    Array.isArray(selectedModel)
                      ? selectedModel.includes(e.uniqueToken)
                      : selectedModel === e.uniqueToken
                  )
                    ? antdToken.colorPrimary
                    : 'transparent',
                }}
                onClick={() => {
                  onSelect(e.uniqueToken, e);
                }}
              >
                <img src={e.inputImages[0]} className={styles.fineTuneCover} />
              </div>
            </Col>
          ),
        )}
      </Row>
      <Pagination
        style={{ textAlign: 'right' }}
        size="small"
        current={page}
        pageSize={pageSize}
        total={privateModels?.length || 0}
        onChange={setPage}
      />
    </>
  );
};

const PAGE_SIZE = 10;

export interface SelectModelListRefs {
  // getValues: () => {
  //   public: string[] | string;
  //   private: string[] | string;
  // };
  // setValues: (values: {
  //   public: string[] | string;
  //   private: string[] | string;
  // }) => void;
}

export interface SelectModelListProps {
  type: API.FineTuneType;
}

const SelectModelList = forwardRef<SelectModelListRefs, SelectModelListProps>(
  ({ type }, ref) => {
    const { personModel, styleModels, handleSelectModel } = useModel(
      'workshop',
      (state) => ({
        personModel: state.personModel,
        styleModels: state.styleModels,
        handleSelectModel: state.handleSelectModel,
      }),
    );

    const { checkSignedIn } = useContext<GlobalContextType>(GlobalContext);

    const { formatMessage } = useIntl();
    const { token: antdToken } = theme.useToken();

    const [tab, setTab] = useState(`${type}-public`);

    // const [selectedPersonPublic, setSelectedPersonPublic] =
    //   useLocalStorageState<string>('workshop.config.person-model-public');
    // const [selectedPersonPrivate, setSelectedPersonPrivate] =
    //   useLocalStorageState<string>(
    //     `workshop.config.person-model-${currentUser?.id}`,
    //   );
    //
    // const [selectedStylesPublic, setSelectedStylesPublic] =
    //   useLocalStorageState<string[]>('workshop.config.style-model-public', {
    //     defaultValue: [],
    //   });
    // const [selectedStylesPrivate, setSelectedStylesPrivate] =
    //   useLocalStorageState<string[]>(
    //     `workshop.config.style-model-${currentUser?.id}`,
    //     { defaultValue: [] },
    //   );

    return (
      <div className={styles.configSubItem}>
        <ThemeTabs
          plain={true}
          wrapperStyle={{ marginBottom: 6 }}
          value={tab}
          onChange={(e) => {
            if (e === `${type}-public` || checkSignedIn()) {
              setTab(e);
            }
          }}
          tabs={[
            {
              label: formatMessage({ id: 'workshop.tabs.public-models' }),
              key: `${type}-public`,
            },
            {
              label: formatMessage({ id: 'workshop.tabs.private-models' }),
              key: `${type}-private`,
            },
          ]}
        />
        {tab === `${type}-public` && (
          <PublicModelList
            selectedModel={type === 'PERSON' ? personModel : styleModels}
            onSelect={(uniqueToken) => {
              handleSelectModel(uniqueToken, type);
            }}
            type={type}
            pageSize={PAGE_SIZE}
          />
        )}
        {tab === `${type}-private` && (
          <PrivateModelList
            selectedModel={type === 'PERSON' ? personModel : styleModels}
            onSelect={(uniqueToken) => {
              handleSelectModel(uniqueToken, type);
            }}
            type={type}
            pageSize={PAGE_SIZE}
          />
        )}
      </div>
    );
  },
);

export default SelectModelList;
