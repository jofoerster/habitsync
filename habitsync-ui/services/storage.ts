import * as SecureStore from 'expo-secure-store';
import {Platform} from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";

const isWebSSR = () => Platform.OS === 'web' && typeof window === 'undefined';
const isWeb = Platform.OS === 'web';

class SecureStorage {
    async getItem(key: string): Promise<string | null> {
        if (isWebSSR()) return null;

        if (isWeb) {
            return AsyncStorage.getItem(key);
        }
        return await SecureStore.getItemAsync(key);
    }

    async setItem(key: string, value: string): Promise<void> {
        if (isWebSSR()) return;

        if (isWeb) {
            await AsyncStorage.setItem(key, value);
            return;
        }
        await SecureStore.setItemAsync(key, value);
    }

    async removeItem(key: string): Promise<void> {
        if (isWebSSR()) return;

        if (isWeb) {
            await AsyncStorage.removeItem(key);
            return;
        }
        await SecureStore.deleteItemAsync(key);
    }

    async multiRemove(keys: string[]): Promise<void> {
        if (isWebSSR()) return;

        if (isWeb) {
            keys.forEach(key => AsyncStorage.removeItem(key));
            return;
        }
        await Promise.all(keys.map(key => SecureStore.deleteItemAsync(key)));
    }
}

export const secureStorage = new SecureStorage();