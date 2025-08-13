import {AuthProvider} from '@/context/AuthContext';
import {useFonts} from 'expo-font';
import {Stack} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {useEffect} from 'react';
import {ThemeProvider} from "@/context/ThemeContext";
import {AlertProvider} from "@/context/AlertContext";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [loaded] = useFonts({
        SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    });

    useEffect(() => {
        if (loaded) {
            SplashScreen.hideAsync();
        }
    }, [loaded]);

    if (!loaded) {
        return null;
    }

    return (
        <ThemeProvider>
            <AlertProvider>
                <AuthProvider>
                    <Stack screenOptions={{headerShown: false}}/>
                </AuthProvider>
            </AlertProvider>
        </ThemeProvider>
    );
}
