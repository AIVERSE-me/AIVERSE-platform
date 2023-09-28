const SafeArea = ({ size = 'default' }: { size?: 'large' | 'default' }) => {
  return <div style={{ height: size === 'default' ? 66 : 90 }} />;
};

export default SafeArea;
