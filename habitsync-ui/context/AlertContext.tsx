import React, { createContext, useContext, useState, ReactNode } from 'react';
import CustomAlert from '../components/CustomAlert';
import AlertConnector from '../components/AlertConnector';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertData {
  id: string;
  title: string;
  message?: string;
  buttons: AlertButton[];
}

interface AlertContextType {
  showAlert: (title: string, message?: string, buttons?: AlertButton[]) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

interface AlertProviderProps {
  children: ReactNode;
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
  const [alerts, setAlerts] = useState<AlertData[]>([]);

  const showAlert = (
    title: string,
    message?: string,
    buttons: AlertButton[] = [{ text: 'OK', style: 'default' }]
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newAlert: AlertData = { id, title, message, buttons };
    setAlerts(prev => [...prev, newAlert]);
  };

  const dismissAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const currentAlert = alerts[0]; // Show one alert at a time

  return (
    <AlertContext.Provider value={{ showAlert }}>
      <AlertConnector />
      {children}
      {currentAlert && (
        <CustomAlert
          visible={true}
          title={currentAlert.title}
          message={currentAlert.message}
          buttons={currentAlert.buttons}
          onDismiss={() => dismissAlert(currentAlert.id)}
        />
      )}
    </AlertContext.Provider>
  );
};
