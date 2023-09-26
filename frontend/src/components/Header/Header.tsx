import QueueAnim from 'rc-queue-anim';
import styles from './Header.less';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { useClickAway, useHover, useMemoizedFn } from 'ahooks';
import {
  FormattedMessage,
  history,
  setLocale,
  useIntl,
  useLocation,
  useModel,
} from '@@/exports';
import {
  TranslationOutlined,
  LoginOutlined,
  FireFilled,
  LogoutOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import BuyPointModal from '@/components/BuyPointModal/BuyPointModal';
import useDevice from '@/hooks/useDevice';
import { Avatar, message } from 'antd';
import LOGO from '@/assets/logo.png';
import { CSSMotionList } from 'rc-motion';
import PointNotice from '@/components/PointNotice/PointNotice';
import ReactCanvasConfetti from 'react-canvas-confetti';
import classNames from 'classnames';
import LoginModal from '@/components/Login/LoginModal';
import { Configure, DEFAULT_LOCALE, LOCALE_ENABLED } from '@/constants';
import { Features } from '@/pages';

const Langs: {
  lang: string;
  label: string;
}[] = [
  {
    lang: 'en-US',
    label: 'English',
  },
  {
    lang: 'zh-CN',
    label: '中文',
  },
];

export interface HeaderRefs {
  checkSignedIn: (redirectPath?: string) => boolean;
}

const Header = forwardRef<HeaderRefs, any>(({}, ref) => {
  const location = useLocation();
  const { pathname } = location;

  const { registerSocketCallback, unregisterSocketCallback } = useModel(
    'socket',
    (state) => ({
      registerSocketCallback: state.registerSocketCallback,
      unregisterSocketCallback: state.unregisterSocketCallback,
    }),
  );
  const { currentUser, logout } = useModel('user', (state) => ({
    currentUser: state.currentUser,
    logout: state.logout,
  }));

  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string | undefined>();
  const [buyPointModalVisible, setBuyPointModalVisible] = useState(false);
  const [pointList, setPointList] = useState<
    { key: React.Key; point: number }[]
  >([]);
  const [mobileSignOutDropdownVisible, setMobileSignOutDropdownVisible] =
    useState(false);
  const [mobileMenuDropdownVisible, setMobileMenuDropdownVisible] =
    useState(false);
  const [confettiVisible, setConfettiVisible] = useState(false);

  const verseRef = useRef<any>();
  const langRef = useRef<any>();
  const avatarRef = useRef<HTMLDivElement>(null);
  const verseHovered = useHover(verseRef);
  const langHovered = useHover(langRef);
  const avatarHovered = useHover(avatarRef);
  const confettiRef = useRef<any>();
  const mobileMenuRef = useRef<any>();
  const mobileAvatarRef = useRef<any>();

  useClickAway(() => {
    setMobileSignOutDropdownVisible(false);
  }, mobileAvatarRef);
  useClickAway(() => {
    setMobileMenuDropdownVisible(false);
  }, mobileMenuRef);

  const { formatMessage, locale } = useIntl();
  const { isMobile } = useDevice();
  const [_message, messageContextHolder] = message.useMessage();

  useImperativeHandle(ref, () => ({
    checkSignedIn: (redirectPath?: string) => {
      const signedIn = !!currentUser;
      if (!signedIn) {
        setRedirectPath(redirectPath);
        setLoginModalVisible(true);
      }
      return signedIn;
    },
  }));

  const makeShot = useMemoizedFn((particleRatio, opts) => {
    confettiRef?.current?.({
      ...opts,
      origin: { y: 0.7 },
      particleCount: Math.floor(200 * particleRatio),
    });
  });

  const fireConfetti = useMemoizedFn(() => {
    makeShot(0.25, {
      spread: 26,
      startVelocity: 55,
    });

    makeShot(0.2, {
      spread: 60,
    });

    makeShot(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });

    makeShot(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    });

    makeShot(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  });

  const updatePointList = useMemoizedFn((point: number) => {
    setPointList([
      {
        key: `${new Date().valueOf()}`,
        point,
      },
    ]);
    setConfettiVisible(true);
    setTimeout(() => {
      fireConfetti();
    }, 0);
    setTimeout(() => {
      setConfettiVisible(false);
    }, 3500);
  });

  useEffect(() => {
    registerSocketCallback('header', {
      onPointsAward: (points: number) => {
        updatePointList(points);
      },
    });

    return () => {
      unregisterSocketCallback('header');
    };
  }, []);

  useEffect(() => {
    if (!LOCALE_ENABLED) {
      setLocale(DEFAULT_LOCALE);
    }
  }, []);

  return isMobile ? (
    <div
      className={styles.header}
      style={{
        paddingBottom: mobileMenuDropdownVisible
          ? 400
          : mobileSignOutDropdownVisible
          ? 60
          : 12,
      }}
    >
      <div className={styles.contentMobile}>
        <div
          style={{ cursor: 'pointer', height: 20 }}
          onClick={() => {
            history.push('/');
          }}
        >
          <img src={LOGO} style={{ height: '100%' }} />
        </div>
        <div className={styles.rightContent}>
          <div className={styles.menus}>
            <div
              ref={mobileMenuRef}
              className={classNames(styles.menu, styles.menuBtnMobile)}
            >
              <MenuOutlined
                onClick={() =>
                  setMobileMenuDropdownVisible(
                    (mobileMenuDropdownVisible) => !mobileMenuDropdownVisible,
                  )
                }
              />
              <QueueAnim
                onClick={() => setMobileMenuDropdownVisible(false)}
                className={styles.menuDropdown}
              >
                {mobileMenuDropdownVisible
                  ? [
                      <div
                        key={'universe'}
                        className={classNames(styles.menuMobile)}
                        onClick={() => history.push('/features/text-to-image')}
                      >
                        <FormattedMessage id={'menu.verse'} />
                      </div>,
                      Configure.activity ? (
                        <div
                          key={'activity'}
                          className={classNames(styles.menuMobile)}
                          onClick={() => history.push('/activity')}
                          style={{ color: '#f5222d' }}
                        >
                          <FireFilled
                            style={{ color: '#f5222d', marginRight: 2 }}
                          />
                          <FormattedMessage id={'menu.activity'} />
                        </div>
                      ) : null,
                      <div
                        key={'collection'}
                        className={classNames(styles.menuMobile)}
                        onClick={() => history.push('/collection')}
                      >
                        <FormattedMessage id={'menu.my-collection'} />
                      </div>,
                      <div
                        key={'gallery'}
                        className={classNames(styles.menuMobile)}
                        onClick={() => history.push('/gallery')}
                      >
                        <FormattedMessage id={'menu.gallery'} />
                      </div>,
                      <div
                        key={'buy'}
                        className={styles.menuMobile}
                        onClick={() => {
                          const key = new Date().valueOf();
                          _message.open({
                            type: 'info',
                            key,
                            content: formatMessage({
                              id: 'message.mobile-tip',
                            }),
                          });
                          setTimeout(() => {
                            _message.destroy(key);
                          }, 1000);
                        }}
                      >
                        <FormattedMessage id={'menu.buy'} />
                      </div>,
                      Configure.readme ? (
                        <div
                          key={'readme'}
                          className={classNames(styles.menuMobile)}
                          onClick={() => {
                            setMobileMenuDropdownVisible(false);
                            history.push('/readme');
                          }}
                        >
                          <FormattedMessage id={'menu.readme'} />
                        </div>
                      ) : null,
                    ].filter((e) => !!e)
                  : []}
              </QueueAnim>
            </div>
          </div>
          <div ref={mobileAvatarRef} className={styles.loginContainer}>
            <div className={styles.user}>
              {currentUser ? (
                <Avatar
                  style={{ background: 'rgb(255 255 255 / 50%)' }}
                  onClick={() => {
                    setMobileSignOutDropdownVisible(
                      (mobileSignOutDropdownVisible) =>
                        !mobileSignOutDropdownVisible,
                    );
                  }}
                  src={currentUser.avatarUrl}
                />
              ) : (
                <div
                  className={styles.loginButton}
                  onClick={() => {
                    setLoginModalVisible(true);
                  }}
                >
                  <LoginOutlined style={{ marginRight: 6 }} />
                  <span>{formatMessage({ id: 'header.sign-in' })}</span>
                </div>
              )}
            </div>
            <div>
              <QueueAnim
                duration={[300, 300]}
                leaveReverse={true}
                className={styles.menuDropdown}
              >
                {currentUser && mobileSignOutDropdownVisible
                  ? [
                      <div
                        key={'lougout'}
                        className={classNames(styles.signOutButtonMobile)}
                        onClick={logout}
                      >
                        <LogoutOutlined style={{ marginRight: 8 }} />
                        {formatMessage({ id: 'header.sign-out' })}
                      </div>,
                    ]
                  : []}
              </QueueAnim>
            </div>
          </div>
        </div>
      </div>
      <LoginModal
        open={loginModalVisible}
        redirectPath={redirectPath}
        onClose={() => setLoginModalVisible(false)}
      />
      {messageContextHolder}
    </div>
  ) : (
    <div
      className={styles.header}
      style={{
        paddingBottom: verseHovered
          ? Features.length * 40 + 12
          : avatarHovered
          ? (Configure.profile ? 80 : 40) + 12
          : langHovered
          ? 80 + 12
          : 12,
      }}
    >
      <div className={styles.content}>
        <div
          style={{ cursor: 'pointer', height: 20 }}
          onClick={() => {
            history.push('/');
          }}
        >
          <img src={LOGO} style={{ height: '100%' }} />
        </div>
        <div className={styles.rightContent}>
          <div className={styles.menus}>
            <div
              ref={verseRef}
              className={classNames(styles.menu, {
                [styles.menuActive]: pathname.startsWith('/features'),
              })}
            >
              <FormattedMessage id={'menu.verse'} />
              <QueueAnim
                duration={[300, 300]}
                leaveReverse={true}
                className={styles.menuDropdown}
              >
                {verseHovered
                  ? Features.map((e) => (
                      <div
                        key={e.key}
                        className={[
                          styles.menuDropdownItem,
                          pathname.startsWith(e.location)
                            ? styles.menuDropdownItemActive
                            : '',
                        ].join(' ')}
                        onClick={() => history.push(e.location)}
                      >
                        <FormattedMessage id={e.title} />
                      </div>
                    ))
                  : []}
              </QueueAnim>
            </div>
            {Configure.activity && (
              <div
                className={classNames(styles.menu, {
                  [styles.menuActive]: pathname === '/activity',
                })}
                onClick={() => history.push('/activity')}
                style={{ color: '#f5222d' }}
              >
                <FireFilled style={{ color: '#f5222d', marginRight: 2 }} />
                <FormattedMessage id={'menu.activity'} />
              </div>
            )}
            {Configure.collection && (
              <div
                className={classNames(styles.menu, {
                  [styles.menuActive]: pathname === '/collection',
                })}
                onClick={() => history.push('/collection')}
              >
                <FormattedMessage id={'menu.my-collection'} />
              </div>
            )}
            <div
              className={classNames(styles.menu, {
                [styles.menuActive]: pathname === '/gallery',
              })}
              onClick={() => history.push('/gallery')}
            >
              <FormattedMessage id={'menu.gallery'} />
            </div>
            <div
              className={styles.menu}
              onClick={() => {
                if (currentUser) {
                  setBuyPointModalVisible(true);
                } else {
                  setLoginModalVisible(true);
                }
              }}
            >
              <FormattedMessage id={'menu.buy'} />
            </div>
            {Configure.readme && (
              <div
                className={classNames(styles.menu, {
                  [styles.menuActive]: pathname === '/readme',
                })}
                onClick={() => history.push('/readme')}
              >
                <FormattedMessage id={'menu.readme'} />
              </div>
            )}
            {LOCALE_ENABLED && (
              <div
                ref={langRef}
                className={classNames(styles.menu, styles.menuActive)}
              >
                <TranslationOutlined />
                <QueueAnim
                  duration={[300, 300]}
                  leaveReverse={true}
                  className={styles.menuDropdown}
                >
                  {langHovered
                    ? Langs.map((e) => (
                        <div
                          key={e.lang}
                          className={classNames(styles.menuDropdownItem, {
                            [styles.menuDropdownItemActive]: e.lang === locale,
                          })}
                          onClick={() => setLocale(e.lang, false)}
                        >
                          {e.label}
                        </div>
                      ))
                    : []}
                </QueueAnim>
              </div>
            )}
          </div>
          <div className={styles.loginContainer}>
            <div ref={avatarRef} className={styles.user}>
              {currentUser ? (
                <Avatar
                  onClick={() => {
                    if (Configure.profile) {
                      history.push('/user');
                    }
                  }}
                  style={{ background: '#1f1f1f' }}
                  src={
                    currentUser.avatarUrl
                  }
                />
              ) : (
                <div
                  className={styles.loginButton}
                  onClick={() => {
                    if (pathname !== '/user') {
                      setLoginModalVisible(true);
                    }
                  }}
                >
                  <LoginOutlined style={{ marginRight: 6 }} />
                  <span>{formatMessage({ id: 'header.sign-in' })}</span>
                </div>
              )}
              <CSSMotionList
                className={styles.pointAward}
                keys={pointList}
                motionName={'point-notice-fade'}
                motionAppear={true}
                motionEnter={true}
                motionLeave={true}
                onLeaveStart={(ele) => {
                  const { offsetHeight } = ele;
                  return { height: offsetHeight };
                }}
                onLeaveActive={() => ({ height: 0, opacity: 0, margin: 0 })}
              >
                {(
                  {
                    key,
                    point,
                    className: motionClassName,
                    style: motionStyle,
                  },
                  nodeRef,
                ) => {
                  return (
                    <PointNotice
                      ref={nodeRef}
                      value={point}
                      key={key}
                      eventKey={key}
                      onNoticeClose={() => {
                        setPointList((list) =>
                          list.filter((item) => item.key !== key),
                        );
                      }}
                      classname={motionClassName}
                      style={motionStyle}
                    />
                  );
                }}
              </CSSMotionList>
              <QueueAnim
                duration={[300, 300]}
                leaveReverse={true}
                className={styles.menuDropdown}
              >
                {avatarHovered && currentUser
                  ? [
                      Configure.profile ? (
                        <div
                          key={'profile'}
                          className={classNames(styles.menuDropdownItem)}
                          onClick={() => history.push('/user')}
                        >
                          {formatMessage({ id: 'header.profile' })}
                        </div>
                      ) : null,
                      <div
                        key={'lougout'}
                        className={classNames(styles.menuDropdownItem)}
                        onClick={logout}
                      >
                        <LogoutOutlined style={{ marginRight: 8 }} />
                        {formatMessage({ id: 'header.sign-out' })}
                      </div>,
                    ].filter((e) => !!e)
                  : []}
              </QueueAnim>
            </div>
            {confettiVisible && (
              <ReactCanvasConfetti
                refConfetti={(instance) => {
                  confettiRef.current = instance;
                }}
                className={styles.pointConfetti}
                width={400}
                height={200}
                onFire={() => {}}
                onDecay={() => {
                  setConfettiVisible(false);
                }}
              />
            )}
          </div>
        </div>
      </div>
      <LoginModal
        open={loginModalVisible}
        redirectPath={redirectPath}
        onClose={() => setLoginModalVisible(false)}
      />
      <BuyPointModal
        open={buyPointModalVisible}
        onClose={() => setBuyPointModalVisible(false)}
      />
      {messageContextHolder}
    </div>
  );
});

export default Header;
