import styles from './Layout.less';
import { FeatureMenus } from '@/components/FeatureMenu/FeatureMenu';
import { useIntl, useModel } from '@@/exports';
import {
  AppstoreAddOutlined,
  AppstoreOutlined,
  ExperimentOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import { AIProductUpload } from '@/components/AIProduct/Upload/Upload';
import { AIProductGenerate } from '@/components/AIProduct/Generate/Generate';
import { CropperModal } from '@/components/AIProduct/CropperModal/CropperModal';
import { useEffect } from 'react';
import { AIProductOutputs } from '@/components/AIProduct/Outputs/Outputs';
import { AIProductHistory } from '@/components/AIProduct/ProductHistory/ProductHistory';

export const AIProductLayout = ({ type }: { type: 'product' | 'model' }) => {
  const { currentUser } = useModel('user', (state) => ({
    currentUser: state.currentUser,
  }));
  const { setFeature, menu, setMenu, checkSegmentTask } = useModel(
    'product',
    (state) => ({
      setFeature: state.setFeature,
      menu: state.menu,
      setMenu: state.setMenu,
      checkSegmentTask: state.checkSegmentTask,
    }),
  );
  const { formatMessage } = useIntl();

  useEffect(() => {
    if (!currentUser) {
      setMenu('upload');
    } else {
      checkSegmentTask();
    }
  }, [currentUser]);

  useEffect(() => {
    setFeature(type);
  }, []);

  return (
    <div className={styles.layout}>
      <FeatureMenus
        menus={[
          {
            key: 'upload',
            label: formatMessage({ id: 'ai-product.menu.upload' }),
            icon: <AppstoreAddOutlined />,
          },
          {
            key: 'generate',
            label: formatMessage({ id: 'ai-product.menu.generate' }),
            icon: <ExperimentOutlined />,
          },
          {
            key: 'history',
            label: formatMessage({ id: 'ai-product.menu.history' }),
            icon: <AppstoreOutlined />,
          },
          {
            key: 'gallery',
            label: formatMessage({ id: 'ai-product.menu.gallery' }),
            icon: <PictureOutlined />,
          },
        ]}
        value={menu}
        onChange={(e) => setMenu(e as any)}
      />
      <div style={{ flex: 1 }}>
        {menu === 'upload' && <AIProductUpload type={type} />}
        {menu === 'generate' && <AIProductGenerate type={type} />}
        {menu === 'history' && <AIProductHistory type={type} />}
        {menu === 'gallery' && <AIProductOutputs type={type} />}
      </div>
      <CropperModal type={type} />
    </div>
  );
};
