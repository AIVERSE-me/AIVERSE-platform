import Header, { HeaderRefs } from '@/components/Header/Header';
import { Outlet } from 'umi';
import {
  useLocation,
  history,
  FormattedMessage,
  Helmet,
  useIntl,
} from '@@/exports';
import useDevice from '@/hooks/useDevice';
import React, { createContext, useEffect, useRef, useState } from 'react';
import { GlobalScrollbar, MacScrollbar } from 'mac-scrollbar';
import 'mac-scrollbar/dist/mac-scrollbar.css';
import { useCountDown, useCreation, useSize } from 'ahooks';
import styles from './index.less';
import { FireFilled, HomeFilled, MobileOutlined } from '@ant-design/icons';
import {
  AVAILABLE_PATHNAME_FOR_MOBILE,
  Configure,
  H5_REDIRECT_URI,
} from '@/constants';
import classNames from 'classnames';
import { Button, message, Modal } from 'antd';
import License from '@/components/License/License';
import { setGlobalMessage, setGlobalModal } from '@/utils/global';
import BuyPointModal from '@/components/BuyPointModal/BuyPointModal';

export interface GlobalContextType {
  checkSignedIn: (redirectPath?: string) => boolean;
  openBuyPointModal: VoidFunction;
}

export const GlobalContext = createContext<GlobalContextType>({
  checkSignedIn: (redirectPath?: string) => false,
  openBuyPointModal: () => {},
});

export default function Layout() {
  const location = useLocation();
  const { pathname } = location;
  const { formatMessage } = useIntl();
  const [_message, messageContextHolder] = message.useMessage();
  useEffect(() => {
    setGlobalMessage(_message);
  }, [_message]);
  const [modal, modalContextHolder] = Modal.useModal();
  useEffect(() => {
    setGlobalModal(modal);
  }, [modal]);

  const [buyPointModalVisible, setBuyPointModalVisible] = useState(false);
  const [mobileMaskCountdown, setMobileMaskCountDown] = useState(4000);
  const [_, formattedRes] = useCountDown({
    leftTime: mobileMaskCountdown,
  });

  const headerRef = useRef<HeaderRefs>(null);

  const { isMobile } = useDevice();
  const size = useSize(window.document.body);

  const showPCTip = useCreation(() => {
    return (
      isMobile &&
      pathname !== '/' &&
      !AVAILABLE_PATHNAME_FOR_MOBILE.find((p) => pathname.startsWith(p))
    );
  }, [isMobile, pathname]);

  useEffect(() => {
    if (isMobile && H5_REDIRECT_URI) {
      window.location.href = H5_REDIRECT_URI;
    }
  }, [isMobile]);

  useEffect(() => {
    if (
      !Configure.parallelUniverse &&
      pathname.startsWith('/universe/parallel')
    ) {
      history.replace('/');
    }
    if (!Configure.profile && pathname.startsWith('/user')) {
      history.replace('/');
    }
    if (!Configure.readme && pathname.startsWith('/readme')) {
      history.replace('/');
    }
    if (!Configure.activity && pathname.startsWith('/activity')) {
      history.replace('/');
    }
  }, [pathname]);

  return (
    <GlobalContext.Provider
      value={{
        checkSignedIn: (redirectPath?: string) =>
          headerRef.current?.checkSignedIn(redirectPath) || false,
        openBuyPointModal: () => setBuyPointModalVisible(true),
      }}
    >
      <div
        className={classNames({ [styles.mobileUserSelect]: isMobile })}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflowX: 'hidden',
        }}
      >
        <Header ref={headerRef} />
        {showPCTip ? (
          <>
            <Helmet title={formatMessage({ id: 'helmet.aiverse' })} />
            <div className={styles.mobileTip}>
              <div>{formatMessage({ id: 'message.mobile-tip' })}</div>
              <Button
                href={'#/'}
                size={'large'}
                icon={<HomeFilled />}
                shape={'round'}
              >
                {formatMessage({ id: 'button.homepage' })}
              </Button>
              {AVAILABLE_PATHNAME_FOR_MOBILE.includes('/activity') && (
                <Button
                  href={'#/activity'}
                  size={'large'}
                  icon={<FireFilled />}
                  shape={'round'}
                >
                  {formatMessage({ id: 'button.explore-activities' })}
                </Button>
              )}
            </div>
          </>
        ) : (
          <Outlet />
        )}
        {/*<GlobalScrollbar />*/}
        {isMobile &&
          pathname === '/' &&
          (size?.width || 0) < (size?.height || 1) &&
          formattedRes.seconds > 0 && (
            <div
              className={styles.rotateTip}
              onClick={() => setMobileMaskCountDown(0)}
            >
              <MobileOutlined className={styles.rotateIcon} />
              <FormattedMessage
                id={'layout.rotate-tip'}
                values={{ time: formattedRes.seconds }}
              />
              <div className={styles.skipTip}>
                <FormattedMessage id={'layout.skip'} />
              </div>
            </div>
          )}
      </div>
      {pathname !== '/' && (
        <div className={styles.footerContainer}>
          <div
            className={styles.footer}
            style={{ width: isMobile ? 'calc(100% - 48px)' : 1200 }}
          >
            <License />
          </div>
        </div>
      )}
      <BuyPointModal
        open={buyPointModalVisible}
        onClose={() => setBuyPointModalVisible(false)}
      />
      {messageContextHolder}
      {modalContextHolder}
    </GlobalContext.Provider>
  );
}
