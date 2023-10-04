import styles from './GenerateButton.less';
import { theme } from 'antd';
import { useCreation, useHover } from 'ahooks';
import { useRef } from 'react';
import { useIntl, useModel } from '@@/exports';
import { LoadingOutlined } from '@ant-design/icons';

const { useToken } = theme;

interface GenerateButtonProps {
  loading?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
  className?: string;
  price?: number;
  fixed?: boolean;
  freeTimes?: number;
  showBoxShadow?: boolean;
}

const GenerateButton = ({
  loading = false,
  onClick,
  style = {},
  className = '',
  price = 0,
  fixed = false,
  showBoxShadow = true,
}: GenerateButtonProps) => {
  const { currentUser } = useModel('user', (state) => ({
    currentUser: state.currentUser,
  }));

  const buttonRef = useRef<any>();
  const { token } = useToken();
  const hover = useHover(buttonRef);
  const { formatMessage } = useIntl();

  const color = useCreation(
    () => (hover && !loading ? token.colorPrimaryActive : token.colorPrimary),
    [loading, hover],
  );

  return (
    <div
      className={[styles.container, fixed ? styles.fixed : '', className].join(
        ' ',
      )}
      style={style}
    >
      <div
        onClick={() => {
          if (!loading) {
            onClick?.();
          }
        }}
        ref={buttonRef}
        className={styles.generateButton}
        style={{
          background: color,
          width: loading ? 40 : 450,
          height: loading ? 40 : 56,
          boxShadow: showBoxShadow
            ? '0 0 8px 2px rgba(#000, 0.8), 0 0 16px 4px rgba(#000, 0.6)'
            : 'none',
        }}
      >
        {loading ? (
          <LoadingOutlined />
        ) : (
          <>
            <div>{formatMessage({ id: 'creation.generate' })}</div>
            {currentUser && (
              <div className={styles.price}>
                (
                {price > 0
                  ? formatMessage(
                      { id: 'workshop.price' },
                      {
                        price,
                      },
                    )
                  : formatMessage({ id: 'workshop.price-free' })}
                )
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default GenerateButton;
