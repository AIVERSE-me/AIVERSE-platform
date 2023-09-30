import styles from './PointButtons.less';
import { LoadingOutlined } from '@ant-design/icons';
import { useIntl, useModel } from '@@/exports';
import { useContext } from 'react';
import { GlobalContext, GlobalContextType } from '@/layouts';
import BG_BUT_POINTS from '@/assets/bg-buy-points.json';
import Lottie from 'react-lottie';

const PointButtons = ({
  onOpenBuyPointModal,
  style,
}: {
  onOpenBuyPointModal?: () => void;
  style?: React.CSSProperties;
}) => {
  const { point, gettingPoint, refreshPoint } = useModel(
    'point',
    (state: any) => ({
      point: state.point,
      gettingPoint: state.gettingPoint,
      refreshPoint: state.refreshPoint,
    }),
  );

  const { formatMessage } = useIntl();
  const { checkSignedIn, openBuyPointModal } =
    useContext<GlobalContextType>(GlobalContext);

  return (
    <div className={styles.pointBtnList} style={style}>
      <div
        className={[styles.pointBtn, styles.myPoint].join(' ')}
        onClick={() => refreshPoint()}
      >
        {gettingPoint && <LoadingOutlined style={{ marginRight: 6 }} />}
        {`${point || 0} ${formatMessage({ id: 'points' })}`}
      </div>
      <div
        className={[styles.pointBtn, styles.buyPoint].join(' ')}
        onClick={() => {
          if (checkSignedIn()) {
            (onOpenBuyPointModal || openBuyPointModal)();
          }
        }}
      >
        <div>
          <Lottie
            options={{
              loop: true,
              autoplay: true,
              animationData: BG_BUT_POINTS,
            }}
            isStopped={false}
            isClickToPauseDisabled={true}
            width={172}
          />
        </div>

        <div className={styles.text}>
          {formatMessage({ id: 'portal.buy-points' })}
        </div>
      </div>
    </div>
  );
};

export default PointButtons;
