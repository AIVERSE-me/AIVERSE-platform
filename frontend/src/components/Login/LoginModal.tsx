import { Modal } from 'antd';
import LoginCard from '@/components/Login/LoginCard';

const LoginModal = ({
  open,
  onClose,
  redirectPath,
}: {
  open: boolean;
  onClose: VoidFunction;
  redirectPath?: string;
}) => {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      centered={true}
      footer={null}
      width={420}
      zIndex={1000}
    >
      <LoginCard
        border={false}
        redirectPath={redirectPath}
        onSignedIn={onClose}
      />
    </Modal>
  );
};

export default LoginModal;
