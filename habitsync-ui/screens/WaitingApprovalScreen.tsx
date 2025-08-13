import React from 'react';
import {ActivityIndicator, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useAuth} from '../context/AuthContext';
import {MaterialCommunityIcons} from "@expo/vector-icons";
import {useTheme} from "@/context/ThemeContext";
import {createThemedStyles} from "@/constants/styles";

const WaitingApprovalScreen = () => {
    const {theme} = useTheme();
    const styles = createStyles(theme);

    const {authState, logout, refreshAuthState} = useAuth();

    const handleRefresh = async () => {
        try {
            await refreshAuthState();
        } catch (error) {
            console.error('Failed to refresh auth state:', error);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="clock-outline" size={80} color="#FF9800"/>
            </View>

            <View style={styles.contentContainer}>
                <Text style={styles.title}>Waiting for Approval</Text>
                <Text style={styles.subtitle}>
                    Your account is pending approval. Please wait for an administrator to approve your access.
                </Text>

                {authState.userInfo && (
                    <View style={styles.userInfoContainer}>
                        <Text style={styles.userInfoLabel}>Logged in as:</Text>
                        <Text style={styles.userInfoText}>
                            {authState.userInfo.name || authState.userInfo.email}
                        </Text>
                    </View>
                )}
            </View>

            {authState.error && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{authState.error}</Text>
                </View>
            )}

            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[styles.button, styles.refreshButton]}
                    onPress={handleRefresh}
                    disabled={authState.isLoading}
                >
                    {authState.isLoading ? (
                        <ActivityIndicator size="small" color="#FF9800"/>
                    ) : (
                        <>
                            <MaterialCommunityIcons name="refresh" size={20} color="#FF9800"/>
                            <Text style={styles.refreshButtonText}>Check Status</Text>
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.logoutButton]}
                    onPress={handleLogout}
                    disabled={authState.isLoading}
                >
                    <MaterialCommunityIcons name="logout" size={20} color="#666"/>
                    <Text style={styles.logoutButtonText}>Sign Out</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const createStyles = createThemedStyles((theme) => StyleSheet.create({

    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: theme.background,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    contentContainer: {
        marginBottom: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
        color: theme.text,
    },
    subtitle: {
        fontSize: 16,
        color: theme.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    userInfoContainer: {
        backgroundColor: theme.surfaceSecondary,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    userInfoLabel: {
        fontSize: 14,
        color: theme.surfaceTertiary,
        marginBottom: 4,
    },
    userInfoText: {
        fontSize: 16,
        fontWeight: '500',
        color: theme.text,
    },
    errorContainer: {
        backgroundColor: '#ffebee',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
    },
    errorText: {
        color: '#d32f2f',
        textAlign: 'center',
        fontSize: 14,
    },
    buttonContainer: {
        gap: 12,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 8,
        gap: 8,
    },
    refreshButton: {
        backgroundColor: '#fff3e0',
        borderWidth: 1,
        borderColor: '#FF9800',
    },
    refreshButtonText: {
        color: '#FF9800',
        fontSize: 16,
        fontWeight: '600',
    },
    logoutButton: {
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    logoutButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '500',
    },
}));

export default WaitingApprovalScreen;