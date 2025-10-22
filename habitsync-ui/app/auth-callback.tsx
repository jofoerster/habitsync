import {useEffect, useState} from 'react';
import {useRouter} from 'expo-router';
import {ActivityIndicator, Platform, StyleSheet, Text, View} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import WebOAuthService from '@/services/oauth-web';
import {authApi} from '@/services/api';
import {useAuth} from '@/context/AuthContext';

WebBrowser.maybeCompleteAuthSession();

export default function AuthCallback() {
    const router = useRouter();
    const {setTokens, refreshAuthState} = useAuth();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {

        if (Platform.OS === 'web') {
            handleWebCallback();
        } else {
            const timer = setTimeout(() => {
                console.log('[AuthCallback] Native platform - redirecting to home');
                router.replace('/');
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [router]);

    const handleWebCallback = async () => {
        try {
            console.log('[AuthCallback] Handling web OAuth callback');

            const result = await WebOAuthService.handleCallback();

            if (result.type === 'success') {
                console.log('[AuthCallback] OAuth successful, exchanging for app tokens');

                const tokenPair = await authApi.getTokenPair(result.idToken || result.accessToken || '');
                await setTokens(tokenPair.accessToken, tokenPair.refreshToken);
                await refreshAuthState();

                router.replace('/');
            } else {
                console.error('[AuthCallback] OAuth failed:', result.error);
                setError(result.error || 'Authentication failed');

                setTimeout(() => {
                    router.replace('/login');
                }, 3000);
            }
        } catch (error) {
            console.error('[AuthCallback] Error handling callback:', error);
            setError(error instanceof Error ? error.message : 'Failed to complete authentication');

            setTimeout(() => {
                router.replace('/login');
            }, 3000);
        }
    };

    return (
        <View style={styles.container}>
            {error ? (
                <>
                    <Text style={styles.errorText}>❌ {error}</Text>
                    <Text style={styles.subText}>Redirecting to login...</Text>
                </>
            ) : (
                <>
                    <ActivityIndicator size="large" color="#2196F3"/>
                    <Text style={styles.text}>Completing sign in...</Text>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    text: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    errorText: {
        fontSize: 18,
        color: '#f44336',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    subText: {
        marginTop: 8,
        fontSize: 14,
        color: '#999',
    },
});
