import styles from './CornerTriangle.less';

export const CornerTriangle = ({
  children,
  color = '#f1f1f1',
  size = 100,
  shadowColor = 'rgba(0, 0, 0, 0.15)',
}: {
  children: any;
  color?: string;
  shadowColor?: string;
  size?: number;
}) => {
  return (
    <div
      className={styles.triangle}
      style={{
        width: size,
        height: size,
        top: -size / 2,
        left: -size / 2,
        backgroundColor: color,
        boxShadow: ` 0 0 3px 2px ${shadowColor}`,
      }}
    >
      <span style={{ marginBottom: size / 12, fontSize: size < 80 ? 12 : 14 }}>
        {children}
      </span>
    </div>
  );
};
