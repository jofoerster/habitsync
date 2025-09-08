import React, {useEffect, useState} from 'react';
import {ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useAuth} from '@/context/AuthContext';
import {useLocalSearchParams, useRouter} from 'expo-router';
import {MaterialCommunityIcons} from "@expo/vector-icons";
import {authApi, SupportedOIDCIssuer, SupportedOIDCIssuers} from '@/services/api';
import UsernamePasswordModal from '../components/UsernamePasswordModal';
import {capitalizeFirstLetter} from "@/util/util";
import alert from "@/services/alert";
import {useTheme} from "@/context/ThemeContext";
import {createThemedStyles} from "@/constants/styles";


const LoginScreen = () => {
    const {theme} = useTheme();
    const styles = createStyles(theme);

    const {loginWithOAuth2Provider, loginWithUsernamePassword, authState} = useAuth();
    const {redirectPath} = useLocalSearchParams<{ redirectPath?: string }>();
    const router = useRouter();
    const [loginMethods, setLoginMethods] = useState<SupportedOIDCIssuers | null>(null);
    const [loadingMethods, setLoadingMethods] = useState(true);
    const [showUsernamePasswordModal, setShowUsernamePasswordModal] = useState(false);

    useEffect(() => {
        fetchLoginMethods();
    }, []);

    useEffect(() => {
        if (authState.isAuthenticated && authState.isApproved) {
            router.replace(redirectPath || '/');
        } else if (authState.isAuthenticated && !authState.isApproved) {
            router.replace('/waiting-approval');
        }
    }, [authState.isAuthenticated, authState.isApproved, redirectPath, router]);

    const fetchLoginMethods = async () => {
        try {
            const methods = await authApi.getSupportedOIDCIssuers();
            setLoginMethods(methods);
        } catch (error) {
            console.error('Failed to fetch login methods:', error);
            alert(
                'Error',
                'Failed to load login options. Please try again.',
                [{text: 'OK'}]
            );
        } finally {
            setLoadingMethods(false);
        }
    };

    const handleOAuth2Login = async (provider: SupportedOIDCIssuer) => {
        try {
            await loginWithOAuth2Provider(provider, redirectPath || '/');
            console.log('OAuth login successful');
        } catch (error) {
            console.error('OAuth2 login failed:', error);
            alert(
                'Login Failed',
                'Unable to complete login. Please try again.',
                [{text: 'OK'}]
            );
        }
    };

    const handleUsernamePasswordLogin = async (username: string, password: string) => {
        try {
            await loginWithUsernamePassword(username, password, redirectPath || '/');
            setShowUsernamePasswordModal(false);
        } catch (error) {
            console.error('Username/password login failed:', error);
            alert(
                'Login Failed',
                'Invalid username or password. Please try again.',
                [{text: 'OK'}]
            );
        }
    };

    const getProviderIcon = (providerId: string) => {
        switch (providerId.toLowerCase()) {
            case 'google':
                return 'google' as const;
            case 'github':
                return 'github' as const;
            case 'microsoft':
            case 'azure':
                return 'microsoft' as const;
            case 'facebook':
                return 'facebook' as const;
            case 'twitter':
                return 'twitter' as const;
            case 'linkedin':
                return 'linkedin' as const;
            default:
                return 'login' as const;
        }
    };

    const isCurrentlyLoading = authState.isLoading;

    if (loadingMethods) {
        return (
            <View style={styles.container}>
                <View style={styles.logoContainer}>
                    <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={80} color="#2196F3"/>
                    <Text style={styles.appName}>HabitSync</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2196F3"/>
                    <Text style={styles.loadingText}>Loading login options...</Text>
                </View>
            </View>
        );
    }

    const hasOAuth2Providers = loginMethods?.supportedIssuers.length > 0;
    const hasUsernamePassword = loginMethods?.allowBasicAuth;
    const isMaintenanceMode = !hasOAuth2Providers && !hasUsernamePassword;

    const currentError = authState.error;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <View style={styles.logoContainer}>
                <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={80} color="#2196F3"/>
                <Text style={styles.appName}>HabitSync</Text>
            </View>

            <View style={styles.titleContainer}>
                <Text style={styles.title}>Track your habits</Text>
                <Text style={styles.subtitle}>
                    Track and share your habits.
                </Text>
            </View>

            {currentError && (
                <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="alert-circle" size={20} color="#d32f2f"/>
                    <Text style={styles.errorText}>{currentError}</Text>
                </View>
            )}

            {isMaintenanceMode ? (
                <View style={styles.maintenanceContainer}>
                    <MaterialCommunityIcons name="wrench" size={48} color="#ff9800"/>
                    <Text style={styles.maintenanceTitle}>Maintenance mode active</Text>
                    <Text style={styles.maintenanceText}>
                        Login is currently unavailable. Please try again later.
                    </Text>
                </View>
            ) : (
                <View style={styles.loginOptionsContainer}>
                    {/* OAuth2 Providers */}
                    {hasOAuth2Providers && (
                        <View style={styles.providersContainer}>
                            <Text style={styles.sectionTitle}>Sign in with:</Text>
                            {loginMethods?.supportedIssuers.map((provider) => (
                                <TouchableOpacity
                                    key={provider.name}
                                    style={[
                                        styles.providerButton,
                                        {backgroundColor: '#6c757d'},
                                        isCurrentlyLoading && styles.buttonDisabled
                                    ]}
                                    onPress={() => handleOAuth2Login(provider)}
                                    disabled={isCurrentlyLoading}
                                >
                                    {isCurrentlyLoading ? (
                                        <ActivityIndicator size="small" color="#fff"/>
                                    ) : (
                                        <>
                                            <MaterialCommunityIcons
                                                name={getProviderIcon(provider.name)}
                                                size={20}
                                                color="#fff"
                                            />
                                            <Text style={styles.providerButtonText}>
                                                Continue with {capitalizeFirstLetter(provider.name)}
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* Username/Password Login */}
                    {hasUsernamePassword && (
                        <View style={styles.providersContainer}>
                            {loginMethods.oauth2Providers && loginMethods.oauth2Providers.length > 0 && (
                                <View style={styles.divider}>
                                    <View style={styles.dividerLine}/>
                                    <Text style={styles.dividerText}>or</Text>
                                    <View style={styles.dividerLine}/>
                                </View>
                            )}
                            <TouchableOpacity
                                style={[styles.loginButton, isCurrentlyLoading && styles.buttonDisabled]}
                                onPress={() => setShowUsernamePasswordModal(true)}
                                disabled={isCurrentlyLoading}
                            >
                                {isCurrentlyLoading ? (
                                    <ActivityIndicator size="small" color="#fff"/>
                                ) : (
                                    <>
                                        <MaterialCommunityIcons name="login" size={20} color="#fff"/>
                                        <Text style={styles.loginButtonText}>Sign In with Username</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}

            <View style={styles.infoContainer}>
                <Text style={styles.infoText}>
                    If no login options are available,
                    refresh the page.
                </Text>
            </View>

            <UsernamePasswordModal
                visible={showUsernamePasswordModal}
                onClose={() => setShowUsernamePasswordModal(false)}
                onLogin={handleUsernamePasswordLogin}
                loading={isCurrentlyLoading}
            />
        </ScrollView>
    );
};

const createStyles = createThemedStyles((theme) => StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    contentContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    appName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2196F3',
        marginTop: 10,
    },
    titleContainer: {
        marginBottom: 30,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
        color: theme.text,
    },
    subtitle: {
        fontSize: 16,
        color: theme.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
    },
    loadingContainer: {
        alignItems: 'center',
        marginTop: 40,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffebee',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
        gap: 8,
    },
    errorText: {
        color: '#d32f2f',
        flex: 1,
        fontSize: 14,
    },
    loginOptionsContainer: {
        gap: 10,
    },
    providersContainer: {
        gap: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text,
        textAlign: 'center',
        marginBottom: 8,
    },
    providerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 8,
        gap: 12,
    },
    providerButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    loginButton: {
        backgroundColor: '#2196F3',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 8,
        gap: 8,
    },
    authServerButton: {
        backgroundColor: '#f5f5f5',
        borderWidth: 2,
        borderColor: '#2196F3',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 8,
        gap: 8,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    authServerButtonText: {
        color: '#2196F3',
        fontSize: 16,
        fontWeight: '600',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: theme.background,
    },
    dividerText: {
        marginHorizontal: 16,
        fontSize: 14,
        color: theme.textSecondary,
        fontWeight: '500',
    },
    infoContainer: {
        marginTop: 30,
        paddingHorizontal: 10,
    },
    infoText: {
        fontSize: 12,
        color: theme.textSecondary,
        textAlign: 'center',
        lineHeight: 16,
    },
    maintenanceContainer: {
        alignItems: 'center',
        padding: 40,
        backgroundColor: '#fff8e1',
        borderRadius: 12,
        marginVertical: 20,
        borderWidth: 1,
        borderColor: '#ffcc02',
    },
    maintenanceTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#f57c00',
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    maintenanceText: {
        fontSize: 16,
        color: '#e65100',
        textAlign: 'center',
        lineHeight: 22,
    },
}));

export default LoginScreen;