import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import {getLocales} from 'expo-localization';
import {Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import de from './locales/de.json';

export const resources = {
    en: {translation: en},
    de: {translation: de},
} as const;

export const SUPPORTED_LANGUAGES = ['en', 'de'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
    en: 'English',
    de: 'Deutsch',
};

const LANGUAGE_STORAGE_KEY = '@habitsync/language';

const isSupported = (code?: string | null): code is SupportedLanguage =>
    !!code && (SUPPORTED_LANGUAGES as readonly string[]).includes(code);

const getDeviceLanguage = (): SupportedLanguage => {
    const code = getLocales()?.[0]?.languageCode?.toLowerCase();
    return isSupported(code) ? code : 'en';
};

i18n.use(initReactI18next).init({
    resources,
    lng: getDeviceLanguage(),
    fallbackLng: 'en',
    interpolation: {escapeValue: false},
    returnNull: false,
});

// Apply a previously persisted language choice once storage resolves.
// Guard against static web prerendering (Node, no `window`): the web
// AsyncStorage implementation reads `window.localStorage`, which is absent
// during `expo export`. On native, `window` may be undefined too, but the
// native AsyncStorage does not depend on it, so only skip on web-without-window.
const canUseAsyncStorage = Platform.OS !== 'web' || typeof window !== 'undefined';
if (canUseAsyncStorage) {
    AsyncStorage.getItem(LANGUAGE_STORAGE_KEY).then((stored) => {
        if (isSupported(stored) && stored !== i18n.language) {
            i18n.changeLanguage(stored);
        }
    }).catch(() => {
        // ignore storage read errors; fall back to detected/default language
    });
}

export const setAppLanguage = async (lang: SupportedLanguage): Promise<void> => {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    await i18n.changeLanguage(lang);
};

export default i18n;
