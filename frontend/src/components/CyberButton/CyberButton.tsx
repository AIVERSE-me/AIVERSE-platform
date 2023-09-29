import styles from './CyberButton.less';
import { HTMLAttributes } from 'react';

const CyberButton = (
  props: HTMLAttributes<HTMLDivElement> & {
    color?: string;
  },
) => {
  return (
    <div
      className={styles.cyberButton}
      {...props}
      style={{
        background: `linear-gradient(45deg, transparent 5%, ${
          props.color || '#ff013c'
        } 5%)`,
      }}
    >
      {props.children}
    </div>
  );
};

export default CyberButton;
