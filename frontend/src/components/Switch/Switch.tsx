import { theme } from 'antd';
import styles from './Switch.less';

type ThemeSwitchProps<T> = {
  label: string;
  key: T;
  badge?: React.ReactNode;
  iconTooltip?: string;
  // disabled?: boolean;
  icon?: string | React.ReactNode;
};

export function ThemeSwitch<T extends React.Key>({
  value,
  onChange,
  options,
  wrapperStyle = {},
  style = {},
}: {
  value: T;
  onChange: (value: T) => void;
  options: ThemeSwitchProps<T>[];
  wrapperStyle?: React.CSSProperties;
  style?: React.CSSProperties;
}) {
  const { token: antdToken } = theme.useToken();
  const fontSize = style.fontSize || 16;

  return (
    <div className={styles.themeSwitchWrapper} style={wrapperStyle}>
      {options.map((o) => (
        <div
          key={o.key}
          style={{
            background: antdToken.colorPrimaryBg,
            fontSize,
            borderColor:
              value === o.key
                ? antdToken.colorPrimary
                : antdToken.colorPrimaryBg,
          }}
          className={styles.themeSwitchItem}
          onClick={() => {
            if (value !== o.key) {
              onChange(o.key);
            }
          }}
        >
          {o.label}
        </div>
      ))}
    </div>
  );
}
