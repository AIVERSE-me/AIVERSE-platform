import { forwardRef, useEffect } from 'react';
import './PointNotice.less';
import classNames from 'classnames';

interface Props {
  duration?: number;
  value: number;
  eventKey: React.Key;
  onNoticeClose: (key: React.Key) => void;
  classname?: string;
  style?: React.CSSProperties;
}

const PointNotice = forwardRef<HTMLDivElement, Props>(
  (
    { duration = 3, value, eventKey, onNoticeClose, classname, style }: Props,
    ref,
  ) => {
    useEffect(() => {
      if (duration > 0) {
        const timeout = setTimeout(() => {
          onNoticeClose(eventKey);
        }, duration * 1000);
        return () => {
          clearTimeout(timeout);
        };
      }
    }, [duration]);

    return (
      <div
        ref={ref}
        className={classNames('point-notice', 'point', classname)}
        style={style}
      >
        {value > 0 ? `+${value}` : value < 0 ? `-${value}` : ''}
      </div>
    );
  },
);

export default PointNotice;
