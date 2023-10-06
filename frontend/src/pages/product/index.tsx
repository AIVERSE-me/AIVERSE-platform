import styles from './index.less';
import { Helmet, useIntl } from '@@/exports';
import { ConfigProvider } from 'antd';
import SafeArea from '@/components/SafeArea/SafeArea';
import React from 'react';
import { AIProductLayout } from '@/components/AIProduct/Layout/Layout';

const Index = () => {
    const { formatMessage } = useIntl();

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#5B86E5',
                },
            }}
        >
            <Helmet title={formatMessage({ id: 'helmet.ai-product.title' })} />
            <div className={styles.container}>
                <SafeArea size={'large'} />
                <AIProductLayout type={'product'} />
            </div>
        </ConfigProvider>
    );
};

export default Index;
