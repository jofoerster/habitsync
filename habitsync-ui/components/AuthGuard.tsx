import React, {useEffect} from 'react';
import {useAuth} from '@/context/AuthContext';
import {usePathname, useRouter} from 'expo-router';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {createThemedStyles} from "@/constants/styles";
import {useTheme} from "@/context/ThemeContext";

const createStyles = createThemedStyles((theme) => StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        backgroundColor: theme.background,
    }
}));

const PUBLIC_ROUTES = ['/login', '/waiting-approval'];

interface AuthGuardProps {
    children: React.ReactNode;
}

export default function AuthGuard({children}: AuthGuardProps) {
    const {theme} = useTheme();
    const styles = createStyles(theme);

    const {authState} = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (authState.isLoading) return;

        if (PUBLIC_ROUTES.includes(pathname)) return;

        if (!authState.isAuthenticated) {
            console.log("not authenticated, redirecting to login");
            router.replace(`/login?redirectPath=${encodeURIComponent(pathname)}`);
            return;
        }

        if (authState.isAuthenticated && !authState.isApproved) {
            console.log("authenticated but not approved");
            router.replace('/waiting-approval');
            return;
        }
    }, [authState, pathname, router]);

    if (authState.isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2196F3"/>
            </View>
        );
    }

    if (PUBLIC_ROUTES.includes(pathname) ||
        (authState.isAuthenticated && authState.isApproved)) {
        return <>{children}</>;
    }

    return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196F3"/>
        </View>
    );
}
