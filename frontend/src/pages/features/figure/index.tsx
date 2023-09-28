import styles from './index.less';
import { Helmet, useIntl, useLocation } from '@@/exports';
import { ConfigProvider } from 'antd';
import SafeArea from '@/components/SafeArea/SafeArea';
import React, { useEffect, useState } from 'react';
import { FeatureMenus } from '@/components/FeatureMenu/FeatureMenu';
import {
  AppstoreAddOutlined,
  AppstoreOutlined,
  LayoutOutlined,
} from '@ant-design/icons';
import CreatePanel from '@/components/FineTune/CreatePanel/CreatePanel';
import FineTunesPanel from '@/components/FineTune/FineTunesPanel/FineTunesPanel';
import TemplatesPanel from '@/components/FineTune/TemplatesPanel/TemplatesPanel';

type Menu = 'create' | 'model' | 'template';

const Index = () => {
  const { formatMessage } = useIntl();
  const { state } = useLocation();

  const [menu, setMenu] = useState<Menu>('create');

  useEffect(() => {
    if ((state as any)?.menu) {
      setMenu((state as any).menu);
    }
  }, [state]);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#faad14',
        },
      }}
    >
      <Helmet title={formatMessage({ id: 'helmet.figure.title' })} />
      <div className={styles.container}>
        <SafeArea size={'large'} />
        <div className={styles.layout}>
          <FeatureMenus<Menu>
            menus={[
              {
                key: 'create',
                label: formatMessage({ id: 'fine-tune.menu.create' }),
                icon: <AppstoreAddOutlined />,
                needSignedIn: false,
              },
              {
                key: 'model',
                label: formatMessage({ id: 'fine-tune.menu.model' }),
                icon: <AppstoreOutlined />,
                needSignedIn: true,
              },
              {
                key: 'template',
                label: formatMessage({ id: 'fine-tune.menu.template' }),
                icon: <LayoutOutlined />,
                needSignedIn: true,
              },
            ]}
            value={menu}
            onChange={(e) => {
              setMenu(e);
            }}
          />
          <div className={styles.panel}>
            {menu === 'create' && (
              <CreatePanel type={'PERSON'} onCreated={() => setMenu('model')} />
            )}
            {menu === 'model' && (
              <FineTunesPanel
                type={'PERSON'}
                onCreate={() => setMenu('create')}
              />
            )}
            {menu === 'template' && <TemplatesPanel />}
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default Index;
