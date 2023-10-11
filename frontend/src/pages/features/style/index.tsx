import styles from './index.less';
import { Helmet, useIntl } from '@@/exports';
import { ConfigProvider } from 'antd';
import SafeArea from '@/components/SafeArea/SafeArea';
import React, { useState } from 'react';
import { AppstoreAddOutlined, AppstoreOutlined } from '@ant-design/icons';
import { FeatureMenus } from '@/components/FeatureMenu/FeatureMenu';
import CreateFineTune from '@/components/FineTune/CreatePanel/CreatePanel';
import FineTunesPanel from '@/components/FineTune/FineTunesPanel/FineTunesPanel';

type Menu = 'create' | 'model';

const Index = () => {
  const { formatMessage } = useIntl();

  const [menu, setMenu] = useState<Menu>('create');

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#eb2f96',
        },
      }}
    >
      <Helmet title={formatMessage({ id: 'helmet.style-model.title' })} />
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
            ]}
            value={menu}
            onChange={(e) => {
              setMenu(e);
            }}
          />
          <div className={styles.panel}>
            {menu === 'create' && (
              <CreateFineTune
                type={'STYLE'}
                onCreated={() => setMenu('model')}
              />
            )}
            {menu === 'model' && (
              <FineTunesPanel
                type={'STYLE'}
                onCreate={() => setMenu('create')}
              />
            )}
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default Index;
