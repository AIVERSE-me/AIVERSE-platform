import Masonry from 'react-masonry-css';
import styles from './GroupPhotoPreset.less';
import { Button } from 'antd';
import { useIntl } from '@@/exports';
import { useState } from 'react';

interface GroupPhotoPresetProps {
  data: API.GroupPhotoTemplate;
  typeName: string;
  onCreate: VoidFunction;
}

const GroupPhotoPreset = ({
  data,
  typeName,
  onCreate,
}: GroupPhotoPresetProps) => {
  const { formatMessage, locale } = useIntl();
  const [loading, setLoading] = useState(false);

  return (
    <div className={styles.card}>
      <img src={data.displayImg} />
      <div className={styles.meta}>
        <div>{`${typeName} · ${data.positions.length} ${
          locale === 'en-US' ? 'People' : '人'
        }`}</div>
        <Button
          size={'small'}
          shape={'round'}
          type={'primary'}
          loading={loading}
          onClick={async () => {
            setLoading(true);
            await onCreate();
            setLoading(false);
          }}
        >
          {formatMessage({
            id: 'group-photo.create.create-group-photo',
          })}
        </Button>
      </div>
    </div>
  );
};

interface GroupPhotoPresetsProps {
  typeName: string;
  presets: API.GroupPhotoTemplate[];
  onCreate: (presetId: string) => void;
}

const GroupPhotoPresets = ({
  typeName,
  presets,
  onCreate,
}: GroupPhotoPresetsProps) => {
  return (
    <Masonry
      breakpointCols={4}
      className={styles.masonryGrid}
      columnClassName={styles.masonryGridColumn}
    >
      {presets.map((p) => (
        <GroupPhotoPreset
          key={p.id}
          data={p}
          typeName={typeName}
          onCreate={() => onCreate(p.id)}
        />
      ))}
    </Masonry>
  );
};

export default GroupPhotoPresets;
