import styles from './FeatureMenu.less';
import classNames from 'classnames';
import { theme } from 'antd';
import { useHover } from 'ahooks';
import { useContext, useRef } from 'react';
import { GlobalContext, GlobalContextType } from '@/layouts';

interface FeatureMenuProps<T> {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  onClick?: VoidFunction;
  key: T;
  needSignedIn?: boolean;
}

export function FeatureMenu<T extends React.Key>({
  label,
  icon,
  active = false,
  onClick = () => {},
}: FeatureMenuProps<T>) {
  const { token } = theme.useToken();
  const ref = useRef<any>();
  const hovered = useHover(ref);

  return (
    <div
      ref={ref}
      className={classNames(styles.menu)}
      onClick={onClick}
      style={{
        background:
          active || hovered ? token.colorPrimary : 'rgba(255, 255, 255, 0.1)',
      }}
    >
      {icon}
      <div className={styles.menuLabel}>{label}</div>
    </div>
  );
}

interface FeatureMenusProps<T> {
  menus: FeatureMenuProps<T>[];
  value: T;
  onChange: (value: T) => void;
}
export function FeatureMenus<T extends React.Key>({
  menus,
  value,
  onChange,
}: FeatureMenusProps<T>) {
  const { checkSignedIn } = useContext<GlobalContextType>(GlobalContext);

  return (
    <div className={styles.menus}>
      <div className={styles.fixedMenus}>
        {menus.map((e) => (
          <FeatureMenu<T>
            {...e}
            key={e.key}
            active={e.key === value}
            onClick={() => {
              if (!e.needSignedIn || checkSignedIn()) {
                onChange(e.key);
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}
