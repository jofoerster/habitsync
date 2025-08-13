import { Alert, Platform } from 'react-native'

let globalAlertManager: {
  showAlert: (title: string, message?: string, buttons?: any[]) => void;
} | null = null;

export const setGlobalAlertManager = (manager: typeof globalAlertManager) => {
  globalAlertManager = manager;
};

const alertPolyfill = (title: string, description?: string, options?: any[], extra?: any) => {
  if (globalAlertManager) {
    const buttons = options?.map(option => ({
      text: option.text || 'OK',
      style: option.style || 'default',
      onPress: option.onPress
    })) || [{ text: 'OK', style: 'default' }];

    globalAlertManager.showAlert(title, description, buttons);
    return;
  }

  const result = window.confirm([title, description].filter(Boolean).join('\n'));
  try {
    if (result) {
      const confirmOption = options?.find(({style}) => style !== 'cancel');
      confirmOption && confirmOption.onPress();
    } else {
      const cancelOption = options?.find(({style}) => style === 'cancel');
      cancelOption && cancelOption.onPress();
    }
  } catch (error) {
  }
}

const customAlert = (title: string, message?: string, buttons?: any[]) => {
  if (globalAlertManager) {
    const formattedButtons = buttons?.map(button => ({
      text: button.text || 'OK',
      style: button.style || 'default',
      onPress: button.onPress
    })) || [{ text: 'OK', style: 'default' }];

    globalAlertManager.showAlert(title, message, formattedButtons);
  } else if (Platform.OS === 'web') {
    alertPolyfill(title, message, buttons);
  } else {
    Alert.alert(title, message, buttons);
  }
};

export default customAlert;
