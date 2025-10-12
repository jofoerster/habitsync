import { Platform } from 'react-native';
import { secureStorage } from '@/services/storage';

const HOSTNAME_KEY = 'backend_hostname';

declare global {
  interface Window {
    APP_CONFIG?: {
      BACKEND_BASE_URL?: string;
      UI_BASE_URL?: string;
    };
  }
}

const getStoredHostname = async (): Promise<string | null> => {
  try {
    return await secureStorage.getItem(HOSTNAME_KEY);
  } catch (error) {
    console.error('Failed to get stored hostname:', error);
    return null;
  }
};

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
      backend: typeof window !== 'undefined' ? window.location.origin : "",
      ui: typeof window !== 'undefined' ? window.location.origin : ""
    };
  } else {
    return {
      backend: "", // Will be set from stored hostname on mobile
      ui: ""
    };
  }
};

// Synchronous configuration for web (maintains backward compatibility)
const runtimeConfig = getRuntimeConfig();
const defaultUrls = getDefaultUrls();

export const BACKEND_BASE_URL = runtimeConfig.BACKEND_BASE_URL || defaultUrls.backend;
export const UI_BASE_URL = runtimeConfig.UI_BASE_URL || defaultUrls.ui;

// Async configuration for mobile with hostname storage
export const getBackendBaseUrl = async (): Promise<string> => {
  // For web, return the synchronous value
  if (Platform.OS === 'web') {
    return BACKEND_BASE_URL;
  }

  // For mobile, check stored hostname first
  const storedHostname = await getStoredHostname();
  if (storedHostname) {
    return storedHostname;
  }

  // Fallback to environment variable or default
  return runtimeConfig.BACKEND_BASE_URL || defaultUrls.backend;
};

export const getUiBaseUrl = async (): Promise<string> => {
  // For web, return the synchronous value
  if (Platform.OS === 'web') {
    return UI_BASE_URL;
  }

  // Fallback to environment variable or default
  const storedHostname = await getStoredHostname();
  if (storedHostname) {
    return storedHostname;
  }

  // For mobile, use environment variable or default
  return runtimeConfig.UI_BASE_URL || defaultUrls.ui;
};

// Check if hostname needs to be configured (only for mobile when no URL is set)
export const needsHostnameConfiguration = async (): Promise<boolean> => {
  if (Platform.OS === 'web') {
    return false; // Web version uses environment variables or window.location
  }

  const storedHostname = await getStoredHostname();
  const envUrl = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

  // Need hostname configuration if no stored hostname AND no environment variable
  return !storedHostname && !envUrl;
};

export const APP_CONFIG = {
  name: 'HabitSync UI',
  version: '0.0.1',
  buildNumber: 1,
  platform: Platform.OS,
};