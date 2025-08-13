import { useEffect } from 'react';
import { useAlert } from '@/context/AlertContext';
import { setGlobalAlertManager } from '@/services/alert';

const AlertConnector: React.FC = () => {
  const { showAlert } = useAlert();

  useEffect(() => {
    setGlobalAlertManager({ showAlert });
  }, [showAlert]);

  return null;
};

export default AlertConnector;
