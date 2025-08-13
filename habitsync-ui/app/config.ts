declare global {
  interface Window {
    APP_CONFIG?: {
      BACKEND_BASE_URL?: string;
      UI_BASE_URL?: string;
    };
  }
}

const getRuntimeConfig = () => {
  if (typeof window !== 'undefined' && window.APP_CONFIG) {
    return window.APP_CONFIG;
  }

  return {
    BACKEND_BASE_URL: process.env.EXPO_PUBLIC_BACKEND_BASE_URL,
    UI_BASE_URL: process.env.EXPO_PUBLIC_UI_BASE_URL,
  };
};

const runtimeConfig = getRuntimeConfig();

export const BACKEND_BASE_URL = runtimeConfig.BACKEND_BASE_URL || 'http://localhost:8080/api';

export const UI_BASE_URL = runtimeConfig.UI_BASE_URL || 'http://localhost:8081';

export const APP_CONFIG = {
  name: 'Habit Sync UI',
  version: '0.0.1',
  buildNumber: 1,
};
