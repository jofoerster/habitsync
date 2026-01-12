import React, {useEffect} from 'react';
import {useAuth} from '@/context/AuthContext';
import {usePathname, useRouter} from 'expo-router';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {createThemedStyles} from "@/constants/styles";
import {useTheme} from "@/context/ThemeContext";
import {useNetwork} from "@/context/NetworkContext";

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
    const {isOnline} = useNetwork();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (authState.isLoading) return;

        if (PUBLIC_ROUTES.includes(pathname)) return;

        // Only redirect to login if we're online and not authenticated
        // When offline, allow access if user was previously authenticated
        if (!authState.isAuthenticated && isOnline) {
            console.log("not authenticated and online, redirecting to login");
            router.replace(`/login?redirectPath=${encodeURIComponent(pathname)}`);
            return;
        }

        if (authState.isAuthenticated && !authState.isApproved && isOnline) {
            console.log("authenticated but not approved");
            router.replace('/waiting-approval');
            return;
        }
    }, [authState, pathname, router, isOnline]);

    if (authState.isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2196F3"/>
            </View>
        );
    }

    // Allow access if:
    // 1. It's a public route, OR
    // 2. User is authenticated and approved, OR
    // 3. User is offline (assume they were authenticated before going offline)
    if (PUBLIC_ROUTES.includes(pathname) ||
        (authState.isAuthenticated && authState.isApproved) ||
        !isOnline) {
        return <>{children}</>;
    }

    return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196F3"/>
        </View>
    );
}
