import * as SecureStore from 'expo-secure-store';
import {Platform} from 'react-native';

const isWebSSR = () => Platform.OS === 'web' && typeof window === 'undefined';
const isWeb = Platform.OS === 'web';

class SecureStorage {
    async getItem(key: string): Promise<string | null> {
        console.log("Try to load by key ", key);
        if (isWebSSR()) return null;

        if (isWeb) {
            return localStorage.getItem(key);
        }
        return await SecureStore.getItemAsync(key);
    }

    async setItem(key: string, value: string): Promise<void> {
        if (isWebSSR()) return;

        if (isWeb) {
            localStorage.setItem(key, value);
            return;
        }
        await SecureStore.setItemAsync(key, value);
    }

    async removeItem(key: string): Promise<void> {
        if (isWebSSR()) return;

        if (isWeb) {
            localStorage.removeItem(key);
            return;
        }
        await SecureStore.deleteItemAsync(key);
    }

    async multiRemove(keys: string[]): Promise<void> {
        if (isWebSSR()) return;

        if (isWeb) {
            keys.forEach(key => localStorage.removeItem(key));
            return;
        }
        await Promise.all(keys.map(key => SecureStore.deleteItemAsync(key)));
    }
}

export const secureStorage = new SecureStorage();