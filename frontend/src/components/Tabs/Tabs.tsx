import styles from './Tabs.less';
import { Badge, theme, Tooltip } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { useCreation, useMemoizedFn } from 'ahooks';
import classNames from 'classnames';
import { MacScrollbar } from 'mac-scrollbar';
import 'mac-scrollbar/dist/mac-scrollbar.css';

const Tab = ({
  size,
  label,
  icon,
  tooltip,
  disabled,
  active,
  style = {},
  onChange,
  onWidth,
}: {
  size: 'small' | 'medium';
  label: string;
  icon?: string | React.ReactNode;
  tooltip?: string;
  disabled?: boolean;
  active: boolean;
  style?: React.CSSProperties;
  onChange: VoidFunction;
  onWidth: (width: number) => void;
}) => {
  const ref = useRef<any>();
  useEffect(() => {
    if (ref.current) {
      onWidth(ref.current.offsetWidth);
    }
  }, [ref]);
  return (
    <div>
      <Tooltip
        placement={'right'}
        overlayInnerStyle={{ width: 'fit-content', whiteSpace: 'nowrap' }}
        title={tooltip}
      >
        <div
          onClick={() => onChange()}
          ref={ref}
          className={classNames(styles.tab, {
            [styles.tabDisabled]: disabled,
            [styles.tabActive]: active,
            [styles.small]: size === 'small',
          })}
          style={style}
        >
          {icon && typeof icon === 'string' ? (
            <img className={styles.icon} src={icon} />
          ) : icon ? (
            <span style={{ marginRight: 6 }}>{icon}</span>
          ) : undefined}
          {label}
        </div>
      </Tooltip>
    </div>
  );
};

const Tabs = ({
  tabs,
  size = 'medium',
  activeKey,
  onChange,
  style = {},
  tabStyle = {},
  barHeight,
}: {
  tabs: {
    label: string;
    key: string;
    tooltip?: string;
    disabled?: boolean;
    icon?: string | React.ReactNode;
  }[];
  size?: 'medium' | 'small';
  activeKey: string;
  onChange: (key: string) => void;
  style?: React.CSSProperties;
  tabStyle?: React.CSSProperties;
  barHeight?: number;
}) => {
  const _barHeight = barHeight ? barHeight : size === 'small' ? 4 : 6;
  const [tabWidths, setTabWidths] = useState<number[]>(tabs.map(() => 40));

  const activeIndex = useCreation(
    () => tabs.findIndex((t) => t.key === activeKey),
    [activeKey, tabs],
  );

  const inkBarStyleLeft = useCreation(() => {
    const _tabWidths = tabWidths.slice(0, activeIndex);
    return (
      (_tabWidths.length > 0
        ? _tabWidths.reduce((a: number, b: number) => a + b)
        : 0) +
      24 * activeIndex
    );
  }, [activeIndex, tabWidths]);

  const inkBarStyleWidth = useCreation(() => {
    return tabWidths[activeIndex] / 2;
  }, [activeIndex, tabWidths]);

  return (
    <div
      className={classNames(styles.tabs, {
        [styles.small]: size === 'small',
      })}
      style={style}
    >
      {tabs.map((data, index) => (
        <div key={data.key}>
          <Tab
            {...data}
            size={size}
            key={data.key}
            active={activeKey === data.key}
            onChange={() => onChange(data.key)}
            style={tabStyle}
            onWidth={(width) => {
              setTabWidths((value) => {
                const clone = [...value];
                clone[index] = width;
                return clone;
              });
            }}
          />
        </div>
      ))}
      <div
        className={styles.inkBar}
        style={{
          left: inkBarStyleLeft,
          width: inkBarStyleWidth,
          height: _barHeight,
          borderRadius: Math.ceil(_barHeight / 2),
        }}
      />
    </div>
  );
};

export default Tabs;

type ThemeTabProps = {
  label: string;
  key: string;
  badge?: React.ReactNode;
  iconTooltip?: string;
  // disabled?: boolean;
  icon?: string | React.ReactNode;
};

export const ThemeTabs = ({
  value,
  onChange,
  tabs,
  wrapperStyle = {},
  style = {},
  plain = false,
  extra,
}: {
  value: string;
  onChange: (value: string) => void;
  tabs: ThemeTabProps[];
  wrapperStyle?: React.CSSProperties;
  style?: React.CSSProperties;
  plain?: boolean;
  extra?: React.ReactNode;
}) => {
  const { token: antdToken } = theme.useToken();
  const fontSize = style.fontSize || 16;

  const renderTab = useMemoizedFn((tab: ThemeTabProps) => {
    return (
      <div
        key={tab.key}
        onClick={() => onChange(tab.key)}
        className={classNames(styles.themeTab, {
          [styles.themeTabActive]: value === tab.key,
        })}
        style={
          value === tab.key
            ? {
                color: plain
                  ? 'rgba(255, 255, 255, 0.85)'
                  : antdToken.colorPrimary,
                fontSize,
              }
            : {
                color: plain
                  ? 'rgba(255, 255, 255, 0.45)'
                  : 'rgba(255, 255, 255, 0.85)',
                fontSize,
              }
        }
      >
        {tab.icon ? (
          tab.iconTooltip ? (
            <Tooltip title={tab.iconTooltip}>{tab.icon}</Tooltip>
          ) : (
            tab.icon
          )
        ) : null}
        {tab.label}
      </div>
    );
  });

  return (
    <div className={styles.themeTabsWrapper} style={wrapperStyle}>
      <div className={styles.themeTabs} style={style}>
        {tabs.map((tab) =>
          tab.badge ? (
            <Badge
              size={'small'}
              color={antdToken.colorPrimary}
              count={tab.badge}
            >
              {renderTab(tab)}
            </Badge>
          ) : (
            renderTab(tab)
          ),
        )}
      </div>
      {extra}
    </div>
  );
};
