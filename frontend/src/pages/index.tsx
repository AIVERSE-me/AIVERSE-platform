import styles from './index.less';
import VIDEO_POSTER from '@/assets/poster.jpg';
import VIDEO from '@/assets/video_x0.5.webm';
import VIDEO_MP4 from '@/assets/video_x0.5.mp4';
import { useEffect, useRef, useState } from 'react';
import QueueAnim from 'rc-queue-anim';
import CyberButton from '@/components/CyberButton/CyberButton';
import { TwitterOutlined } from '@ant-design/icons';
import { Helmet, history, useIntl } from '@@/exports';
import useDevice from '@/hooks/useDevice';
import { message } from 'antd';
import { useRafInterval } from 'ahooks';
import { Configure } from '@/constants';
import classNames from 'classnames';
import License from '@/components/License/License';

const CarouselItem = ({
  title,
  desc,
  themeColor,
  shadowColor,
  highlight,
  active,
  key,
  onEnterClick,
  onClick,
  styleBefore,
}: {
  title: string;
  desc: string;
  themeColor: string;
  shadowColor: string;
  highlight: boolean;
  active: boolean;
  key: string;
  onEnterClick: VoidFunction;
  onClick: VoidFunction;
  styleBefore: string;
}) => {
  const { formatMessage, locale } = useIntl();

  return (
    <>
      <QueueAnim
        type={'bottom'}
        delay={[500, 0]}
        className={styles.verseCard}
        style={{
          width: active ? '100%' : 0,
        }}
      >
        {active
          ? [
              <div
                key={`${key}-title`}
                className={styles.verseTitle}
                style={{
                  color: themeColor,
                  // backgroundImage:
                  //   'linear-gradient(-4deg, #d89614 50%, transparent 75%, transparent)',
                  textShadow: `${shadowColor} 1px 0 8px`,
                }}
              >
                {formatMessage({ id: desc })}
              </div>,
              <span key={`${key}-button`} className={styles.verseBtn}>
                <CyberButton
                  color={themeColor}
                  onClick={() => {
                    onEnterClick();
                  }}
                >
                  {formatMessage({ id: 'home.enter' })}
                </CyberButton>
              </span>,
            ]
          : null}
      </QueueAnim>
      <div
        className={[
          styles.verseItem,
          styleBefore,
          styles.verseItemBefore,
          highlight || active ? styles.verseItemHighlight : '',
        ].join(' ')}
        style={{
          transform: locale === 'en-US' ? 'rotate(180deg)' : 'none',
        }}
        onClick={onClick}
      >
        {formatMessage({ id: title })}
      </div>
    </>
  );
};

export const Features = [
  {
    key: 'workshop',
    title: 'home.workshop.title',
    desc: 'home.workshop.desc',
    themeColor: '#389e0d',
    shadowColor: '#010500',
    location: '/features/workshop',
    styleBefore: styles.verseItem0,
    enabled: true,
  },
  {
    key: 'figure',
    title: 'home.figure.title',
    desc: 'home.figure.desc',
    themeColor: '#faad14',
    shadowColor: '#2b2111',
    location: '/features/figure',
    styleBefore: styles.verseItem1,
    enabled: true,
  },
  {
    key: 'style-model',
    title: 'home.style-model.title',
    desc: 'home.style-model.desc',
    themeColor: '#eb2f96',
    shadowColor: '#291321',
    location: '/features/style-model',
    styleBefore: styles.verseItem2,
    enabled: true,
  },
  {
    key: 'group-photo',
    title: 'home.group-photo.title',
    desc: 'home.group-photo.desc',
    themeColor: '#8839C5',
    shadowColor: '#29113b',
    location: '/features/group-photo',
    styleBefore: styles.verseItemGroupPhoto,
    enabled: true,
  },
  {
    key: 'ai-product',
    title: 'home.ai-product.title',
    desc: 'home.ai-product.desc',
    themeColor: '#5B86E5',
    shadowColor: '#121d4d',
    location: '/features/ai-product',
    styleBefore: styles.verseItem3,
    enabled: true,
  },
  {
    key: 'ai-model',
    title: 'home.ai-model.title',
    desc: 'home.ai-model.desc',
    themeColor: '#3494E6',
    shadowColor: '#05224d',
    location: '/features/ai-model',
    styleBefore: styles.verseItem4,
    enabled: true,
  },
].filter((c) => c.enabled);

const FeaturesCount = Features.length;

const Index: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [highlightIndex, setHighlightIndex] = useState<number>(0);

  useEffect(() => {
    if (activeIndex === -1) {
      setHighlightIndex(0);
    } else {
      setHighlightIndex(-1);
    }
  }, [activeIndex]);

  useRafInterval(() => {
    if (activeIndex === -1) {
      setHighlightIndex(
        highlightIndex + 1 >= FeaturesCount ? 0 : highlightIndex + 1,
      );
    } else {
    }
  }, 2000);

  const { isMobile } = useDevice();

  const [_message, messageContextHolder] = message.useMessage();
  const { formatMessage, locale } = useIntl();
  const videoRef = useRef<any>();

  // const onWxReady = useMemoizedFn(() => {
  //   // videoRef.current.play();
  // });
  // useEffect(() => {
  //   if (window.WeixinJSBridge) {
  //     onWxReady();
  //   }
  //   document.addEventListener('WeixinJSBridgeReady', onWxReady, false);
  //   return () => {
  //     document.removeEventListener('WeixinJSBridgeReady', onWxReady, false);
  //   };
  // }, []);

  return (
    <div
      className={classNames(styles.container, { [styles.mobile]: isMobile })}
    >
      <Helmet title={formatMessage({ id: 'helmet.home' })} />
      <video
        ref={videoRef}
        className={styles.bgVideo}
        poster={VIDEO_POSTER}
        playsInline={true}
        autoPlay={true}
        muted={true}
        loop={true}
        // onCanPlay={() => {
        //   videoRef.current.playbackRate = 0.5;
        // }}
        preload={'auto'}
      >
        <source src={VIDEO} type={'video/webm'} />
        <source src={VIDEO_MP4} type={'video/mp4'} />
      </video>
      <div className={styles.videoMask} />
      <div className={styles.verseContainer}>
        {Features.map((c, index) => (
          <CarouselItem
            key={c.key}
            title={c.title}
            desc={c.desc}
            themeColor={c.themeColor}
            shadowColor={c.shadowColor}
            highlight={highlightIndex === index}
            active={activeIndex === index}
            styleBefore={c.styleBefore}
            onEnterClick={() => {
              if (isMobile) {
                _message.info(formatMessage({ id: 'message.mobile-tip' }));
              } else {
                history.push(c.location);
              }
            }}
            onClick={() => {
              if (activeIndex === index) {
                setActiveIndex(-1);
              } else {
                setActiveIndex(index);
              }
            }}
          />
        ))}
      </div>
      <div className={styles.footerContainer}>
        <div
          className={styles.footer}
          style={{ width: isMobile ? 'calc(100% - 48px)' : 1200 }}
        >
          <License />
          {Configure.shareToTwitter && (
            <a
              href={'https://twitter.com/AIVERSE_me'}
              rel={'noreferrer noopener'}
              target={'_blank'}
            >
              <TwitterOutlined
                className={styles.footerBtn}
                style={{ color: '#1D9BF0' }}
              />
            </a>
          )}
        </div>
      </div>
      {messageContextHolder}
    </div>
  );
};

export default Index;
