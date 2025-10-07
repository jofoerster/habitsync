import {AuthProvider} from '@/context/AuthContext';
import {useFonts} from 'expo-font';
import {Stack} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {useEffect} from 'react';
import {ThemeProvider} from "@/context/ThemeContext";
import {AlertProvider} from "@/context/AlertContext";
import {StatusBar} from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import {Platform} from 'react-native';

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

    useEffect(() => {
        // Configure translucent navigation bar for Android
        if (Platform.OS === 'android') {
            NavigationBar.setPositionAsync('absolute');
            NavigationBar.setBackgroundColorAsync('#00000000'); // Transparent
        }
    }, []);

    if (!loaded) {
        return null;
    }

    return (
        <ThemeProvider>
            <AlertProvider>
                <AuthProvider>
                    <StatusBar style="dark" translucent={true} backgroundColor="transparent" />
                    <Stack screenOptions={{headerShown: false}}/>
                </AuthProvider>
            </AlertProvider>
        </ThemeProvider>
    );
}
