import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    ScrollView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { createThemedStyles } from '@/constants/styles';
import { secureStorage } from '@/services/storage';
import alert from '@/services/alert';
import { useTranslation } from 'react-i18next';

const HOSTNAME_KEY = 'backend_hostname';

const HostnameScreen = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const router = useRouter();
    
    const [hostname, setHostname] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTestingConnection, setIsTestingConnection] = useState(false);

    const validateHostname = (url: string): boolean => {
        if (!url.trim()) return false;
        
        // Basic URL validation
        try {
            const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
            return urlObj.hostname.length > 0;
        } catch {
            return false;
        }
    };

    const normalizeUrl = (url: string): string => {
        const trimmed = url.trim();
        if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
            return `https://${trimmed}`;
        }
        if (trimmed.endsWith('/')) {
            return trimmed.slice(0, -1);
        }
        if (trimmed.endsWith('/api')) {
            return trimmed.slice(0, -4);
        }
        return trimmed;
    };

    const testConnection = async (url: string): Promise<boolean> => {
        try {
            const normalizedUrl = normalizeUrl(url);
            const testUrl = `${normalizedUrl}/actuator/health`;
            
            const response = await fetch(testUrl, {
                method: 'GET',
            });
            
            return response.ok;
        } catch (error) {
            console.error('Connection test failed:', error);
            return false;
        }
    };

    const handleSaveHostname = async () => {
        if (!validateHostname(hostname)) {
            alert(
                t('hostname.invalidHostnameTitle'),
                t('hostname.invalidHostnameMessage'),
                [{ text: t('common.ok') }]
            );
            return;
        }

        setIsLoading(true);
        setIsTestingConnection(true);

        try {
            const normalizedUrl = normalizeUrl(hostname);
            
            // Test connection to the server
            const connectionTest = await testConnection(normalizedUrl);
            
            if (!connectionTest) {
                alert(
                    t('hostname.connectionFailedTitle'),
                    t('hostname.connectionFailedMessage'),
                    [
                        { text: t('hostname.saveAnyway'), onPress: () => saveHostnameAndContinue(normalizedUrl) },
                        { text: t('common.cancel'), style: 'cancel' }
                    ]
                );
                return;
            }

            await saveHostnameAndContinue(normalizedUrl);
        } catch (error) {
            console.error('Error saving hostname:', error);
            alert(
                t('common.error'),
                t('hostname.failedToSave'),
                [{ text: t('common.ok') }]
            );
        } finally {
            setIsLoading(false);
            setIsTestingConnection(false);
        }
    };

    const saveHostnameAndContinue = async (url: string) => {
        try {
            await secureStorage.setItem(HOSTNAME_KEY, url);
            
            // Force a reload of the app configuration
            if (typeof window !== 'undefined' && window.location) {
                window.location.reload();
            } else {
                router.replace('/login');
            }
        } catch (error) {
            console.error('Error saving hostname:', error);
            alert(
                t('common.error'),
                t('hostname.failedToSave'),
                [{ text: t('common.ok') }]
            );
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.contentContainer}>
                <View style={styles.logoContainer}>
                    <Image source={require('../assets/images/logo-transparent.png')} style={styles.logo} />
                    <Text style={styles.appName}>HabitSync</Text>
                </View>

                <View style={styles.titleContainer}>
                    <Text style={styles.subtitle}>
                        {t('hostname.subtitle')}
                    </Text>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>{t('hostname.inputLabel')}</Text>
                    <View style={styles.inputWrapper}>
                        <MaterialCommunityIcons
                            name="server-network"
                            size={20}
                            color={theme.textSecondary}
                            style={styles.inputIcon}
                        />
                        <TextInput
                            style={styles.textInput}
                            value={hostname}
                            onChangeText={setHostname}
                            placeholder="https://example.com/api"
                            placeholderTextColor={theme.textTertiary}
                            autoCapitalize="none"
                            autoCorrect={false}
                            keyboardType="url"
                            returnKeyType="done"
                            onSubmitEditing={handleSaveHostname}
                            editable={!isLoading}
                        />
                    </View>

                    <Text style={styles.helpText}>
                        {t('hostname.examples')}
                    </Text>
                </View>

                {isTestingConnection && (
                    <View style={styles.testingContainer}>
                        <ActivityIndicator size="small" color={theme.primary} />
                        <Text style={styles.testingText}>{t('hostname.testingConnection')}</Text>
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.saveButton, (!hostname.trim() || isLoading) && styles.buttonDisabled]}
                    onPress={handleSaveHostname}
                    disabled={!hostname.trim() || isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <>
                            <MaterialCommunityIcons name="check" size={20} color="#fff" />
                            <Text style={styles.saveButtonText}>{t('hostname.saveAndContinue')}</Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
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
    logo: {
        width: 80,
        height: 80,
        resizeMode: 'contain',
    },
    appName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.text,
        marginTop: 10,
    },
    titleContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.text,
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: theme.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        maxWidth: 300,
    },
    inputContainer: {
        marginBottom: 30,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text,
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.border,
        paddingHorizontal: 12,
        minHeight: 50,
    },
    inputIcon: {
        marginRight: 12,
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        color: theme.text,
        paddingVertical: 12,
    },
    helpText: {
        fontSize: 12,
        color: theme.textTertiary,
        marginTop: 8,
        fontStyle: 'italic',
    },
    testingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        gap: 8,
    },
    testingText: {
        fontSize: 14,
        color: theme.textSecondary,
    },
    saveButton: {
        backgroundColor: theme.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 8,
        marginBottom: 20,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonDisabled: {
        backgroundColor: theme.disabled,
    },
    infoContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: theme.surface,
        padding: 16,
        borderRadius: 12,
        gap: 12,
        borderLeftWidth: 4,
        borderLeftColor: theme.info,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: theme.textSecondary,
        lineHeight: 18,
    },
}));

export default HostnameScreen;
export { HOSTNAME_KEY };
