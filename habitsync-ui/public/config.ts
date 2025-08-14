import { Platform } from 'react-native';

declare global {
  interface Window {
    APP_CONFIG?: {
      BACKEND_BASE_URL?: string;
      UI_BASE_URL?: string;
    };
  }
}

const getRuntimeConfig = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.APP_CONFIG) {
    return window.APP_CONFIG;
  }

  return {
    BACKEND_BASE_URL: process.env.EXPO_PUBLIC_BACKEND_BASE_URL,
    UI_BASE_URL: process.env.EXPO_PUBLIC_UI_BASE_URL,
  };
};

const getDefaultUrls = () => {
  if (Platform.OS === 'web') {
    return {
      backend: typeof window !== 'undefined' ? window.location.origin + "/api" : "",
      ui: typeof window !== 'undefined' ? window.location.origin : ""
    };
  } else {
    return {
      backend: "", //TODO dynamically configure host on mobile
      ui: ""
    };
  }
};

const runtimeConfig = getRuntimeConfig();
const defaultUrls = getDefaultUrls();

export const BACKEND_BASE_URL = runtimeConfig.BACKEND_BASE_URL || defaultUrls.backend;
export const UI_BASE_URL = runtimeConfig.UI_BASE_URL || defaultUrls.ui;

export const APP_CONFIG = {
  name: 'HabitSync UI',
  version: '0.0.1',
  buildNumber: 1,
  platform: Platform.OS,
};