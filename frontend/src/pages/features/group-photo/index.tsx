import styles from './index.less';
import { Helmet, useIntl, useLocation, useModel } from '@@/exports';
import { Button, ConfigProvider, message } from 'antd';
import SafeArea from '@/components/SafeArea/SafeArea';
import React, { useContext, useEffect, useLayoutEffect, useState } from 'react';
import { FeatureMenus } from '@/components/FeatureMenu/FeatureMenu';
import { AppstoreOutlined, PictureOutlined } from '@ant-design/icons';
import { GlobalContext, GlobalContextType } from '@/layouts';
import {Loading} from "@/components/Icon";
import {getGroupPhotoCatalogs, getMyGroupPhotoTasks} from "@/services/group-photo";
import {useCreation, useInfiniteScroll, useRequest, useThrottleFn} from "ahooks";
import Tabs from '@/components/Tabs/Tabs';
import GroupPhotoPresets from "@/components/GroupPhoto/GroupPhotoPreset/GroupPhotoPreset";

const Empty = ({ onGenerate }: { onGenerate: VoidFunction }) => {
  const { formatMessage, locale } = useIntl();

  return (
    <div className={styles.featureIntro}>
      <div
        className={styles.featureTitle}
        style={{
          backgroundImage: 'linear-gradient(90deg, #9D50BB 0%, #6E48AA 100%)',
        }}
      >
        {formatMessage({ id: 'home.group-photo.title' })}
      </div>
      <div className={styles.featureSubtitle}>
        {formatMessage({ id: 'home.group-photo.desc' })}
      </div>
      <img
        className={styles.featureImage}
        src={`https://res.aiverse.cc/assets/mini/${locale}/example-group-photo.webp`}
      />
      <Button
        size={'large'}
        type={'primary'}
        shape={'round'}
        onClick={onGenerate}
      >
        {formatMessage({ id: 'group-photo.intro.generate' })}
      </Button>
    </div>
  );
};

const pageSize = 16;


const Index = () => {
  const { currentUser } = useModel('user', (state) => ({
    currentUser: state.currentUser,
  }));
  const { formatMessage } = useIntl();
  const [_message, messageContextHolder] = message.useMessage();
  const { checkSignedIn } = useContext<GlobalContextType>(GlobalContext);


  const [menu, setMenu] = useState<React.Key>('collection');
    const [catalog, setCatalog] = useState<API.GroupPhotoCatalog | undefined>();


    const {
    data: groupPhotos,
    loadMore: fetchGroupPhotos,
    noMore,
    loading: loadingGroupPhotos,
    mutate: mutateGroupPhotos,
    reload: refreshGroupPhotos,
  } = useInfiniteScroll(
      async (d) => {
        if (!currentUser) {
          return {
            list: [],
            hasMore: false,
          };
        }
        const page = d ? Math.ceil(d.list.length / pageSize) + 1 : 1;
        const _groupPhotos = await getMyGroupPhotoTasks(page, pageSize);
        return {
          list: _groupPhotos,
          hasMore: _groupPhotos.length === pageSize,
        };
      },
      {
        isNoMore: (data) => {
          return data ? !data.hasMore : false;
        },
        reloadDeps: [currentUser],
      },
  );

  const { run: onScroll } = useThrottleFn(
      () => {
        if (
            window.innerHeight + window.scrollY >=
            document.body.offsetHeight - 2
        ) {
          if (!noMore && !loadingGroupPhotos) {
            fetchGroupPhotos();
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

    const { data: groupPhotoCatalogs = [] } = useRequest(async () => {
        const catalogs = await getGroupPhotoCatalogs();
        setCatalog(catalogs[0]);
        return catalogs;
    });

    const groupPhotoTemplates = useCreation(
        () => groupPhotoCatalogs.find((e) => e.id === catalog?.id)?.templates || [],
        [catalog, groupPhotoCatalogs],
    );

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#8839C5',
        },
      }}
    >
      <Helmet title={formatMessage({ id: 'helmet.group-photo.title' })} />
      <div className={styles.container}>
        <SafeArea size={'large'} />
        <div className={styles.layout}>
          <FeatureMenus
            menus={[
              {
                key: 'collection',
                label: formatMessage({ id: 'group-photo.menu.collection' }),
                icon: <PictureOutlined />,
                needSignedIn: false,
              },
              {
                key: 'preset',
                label: formatMessage({ id: 'group-photo.menu.preset' }),
                icon: <AppstoreOutlined />,
                needSignedIn: false,
              },
            ]}
            value={menu}
            onChange={(e) => {
              setMenu(e);
            }}
          />
          <div style={{ flex: 1 }}>
            {menu === 'collection' &&
                (loadingGroupPhotos ? (
                    <div className={styles.justifyCenter}>
                      <Loading />
                    </div>
                ) : !groupPhotos?.list.length ? (
                    <Empty
                        onGenerate={() => {
                          if (checkSignedIn()) {
                            setMenu('preset');
                          }
                        }}
                    />
                ) : (
                    <></>
                ))}
            {menu === 'preset' && (
                <div>
                    {groupPhotoCatalogs && groupPhotoCatalogs.length > 0 && (
                        <Tabs
                            size={'small'}
                            tabs={
                                groupPhotoCatalogs.map((e) => ({
                                    key: e.id,
                                    label: e.name,
                                })) || []
                            }
                            style={{ marginBottom: 12 }}
                            activeKey={catalog?.id || ''}
                            onChange={(e) =>
                                setCatalog(groupPhotoCatalogs.find((c) => c.id === e))
                            }
                        />
                    )}
                    <GroupPhotoPresets
                        typeName={catalog?.name || ''}
                        presets={groupPhotoTemplates}
                        onCreate={(e) => {}}
                    />
                </div>
            )}
          </div>
        </div>
      </div>

      {messageContextHolder}
    </ConfigProvider>
  );
};

export default Index;
