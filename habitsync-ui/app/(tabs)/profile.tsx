import React, {useEffect, useState} from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import {ApiAccountSettingsReadWrite, serverConfigApi, userApi} from "@/services/api";
import alert from "@/services/alert";
import {AuthService} from "@/services/auth";
import {Link} from 'expo-router';
import {useTheme} from '@/context/ThemeContext';
import {createThemedStyles} from '@/constants/styles';
import ThemeToggle from '@/components/ThemeToggle';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {useApiKey, useEvictApiKeys, useHabitInvitations, useUpdateUserSettings, useUserSettings, useClearAllCache} from "@/hooks/useUser";
import {useAcceptHabitInvitation, useDeclineHabitInvitation} from "@/hooks/useHabitUuids";


const UserSettingsComponent = () => {
    const {theme} = useTheme();
    const styles = createStyles(theme);

    const evictApiKeysMutation = useEvictApiKeys();
    const updateUserProfile = useUpdateUserSettings();
    const acceptInvitation = useAcceptHabitInvitation();
    const declineInvitation = useDeclineHabitInvitation();
    const clearAllCache = useClearAllCache();

    const {data: settings, isLoading: loading} = useUserSettings();
    const {data: habitInvitations, isLoading: habitInvitationsLoading} = useHabitInvitations();
    const [processingInvitation, setProcessingInvitation] = useState<string | null>(null);
    const [useApprise, setUseApprise] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);

    const [updatedSettings, setUpdatedSettings] = useState<ApiAccountSettingsReadWrite>({});

    useEffect(() => {
        if (settings) setUpdatedSettings(settings);
    }, [settings]);

    useEffect(() => {
        const fetchServerConfig = async () => {
            try {
                const config = await serverConfigApi.getServerConfig();
                setUseApprise(config.appriseActive);
            } catch (error) {
                console.error('Failed to fetch server config', error);
            }
        }
        fetchServerConfig();
    }, []);

    const saveSettings = async () => {
        setSaving(true);
        if (!updatedSettings) return;
        try {
            await updateUserProfile.mutateAsync(updatedSettings);
            alert('Success', 'Settings updated successfully');
        } catch (error) {
            alert('Error', 'Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    const handleAcceptInvitation = async (habitUuid: string) => {
        try {
            setProcessingInvitation(habitUuid);
            await acceptInvitation.mutateAsync(habitUuid);
            alert('Success', 'Invitation accepted');
        } catch (error) {
            alert('Error', 'Failed to accept invitation');
        } finally {
            setProcessingInvitation(null);
        }
    };

    const handleDeclineInvitation = async (habitUuid: string) => {
        try {
            setProcessingInvitation(habitUuid);
            await declineInvitation.mutateAsync(habitUuid);
            alert('Success', 'Invitation declined');
        } catch (error) {
            alert('Error', 'Failed to decline invitation');
        } finally {
            setProcessingInvitation(null);
        }
    };

    const handleLogout = async () => {
        clearAllCache();
        await AuthService.getInstance().logout();
    };

    const handleCreateApiKey = async () => {
        try {
            const apiKey = await userApi.getApiKey();
            alert('API Key Created', `Your API Key: ${apiKey}\n\nPlease save this key securely. You won't be able to see it again.`, [
                {
                    text: 'Copy',
                    onPress: async () => {
                        await Clipboard.setStringAsync(apiKey);
                    },
                },
                {
                    text: 'OK',
                    style: 'cancel',
                },
            ]);
        } catch (error) {
            alert('Error', 'Failed to create API key');
        }
    };

    const handleEvictAllApiKeys = async () => {
        try {
            await userApi.evictAllApiKeys();
            alert('Success', 'All API keys have been deleted');
        } catch (error) {
            alert('Error', 'Failed to delete API keys');
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.primary}/>
                <Text style={styles.loadingText}>Loading settings...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View>
                <Text style={styles.header}>Profile & Settings</Text>
                <Text style={styles.subHeader}>Manage your account preferences</Text>
            </View>

            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                {/* Theme Settings Section */}
                <ThemeToggle/>

                {/* Habit Invitations Section */}
                {habitInvitations && habitInvitations.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Habit Invitations</Text>
                        {habitInvitations.map((habit) => (
                            <View key={habit.uuid} style={styles.invitationItem}>
                                <View style={styles.invitationHeader}>
                                    <View style={[styles.habitColorDot, {backgroundColor: `#${habit.color?.toString(16).padStart(6, '0')}`}]} />
                                    <Text style={styles.invitationHabitName}>{habit.name}</Text>
                                </View>
                                <Text style={styles.invitationFrom}>
                                    From: {habit.account.displayName}
                                </Text>
                                <View style={styles.invitationActions}>
                                    <TouchableOpacity
                                        style={[styles.invitationButton, styles.acceptButton]}
                                        onPress={() => handleAcceptInvitation(habit.uuid)}
                                        disabled={processingInvitation === habit.uuid}
                                    >
                                        {processingInvitation === habit.uuid ? (
                                            <ActivityIndicator size="small" color={theme.textInverse} />
                                        ) : (
                                            <>
                                                <MaterialCommunityIcons name="check" size={18} color={theme.textInverse} />
                                                <Text style={styles.invitationButtonText}>Accept</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.invitationButton, styles.declineButton]}
                                        onPress={() => handleDeclineInvitation(habit.uuid)}
                                        disabled={processingInvitation === habit.uuid}
                                    >
                                        {processingInvitation === habit.uuid ? (
                                            <ActivityIndicator size="small" color={theme.textInverse} />
                                        ) : (
                                            <>
                                                <MaterialCommunityIcons name="close" size={18} color={theme.textInverse} />
                                                <Text style={styles.invitationButtonText}>Decline</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account Information</Text>

                    <View style={styles.field}>
                        <Text style={styles.label}>Display Name</Text>
                        <TextInput
                            style={styles.input}
                            value={updatedSettings?.displayName}
                            onChangeText={(text) => setUpdatedSettings({
                                ...updatedSettings,
                                displayName: text,
                            })}
                            placeholder="Enter display name"
                            placeholderTextColor={theme.textTertiary}
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            value={updatedSettings?.email}
                            onChangeText={(mail) => setUpdatedSettings({
                                ...updatedSettings,
                                email: mail,
                            })}
                            placeholder="Enter email"
                            placeholderTextColor={theme.textTertiary}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Authentication ID</Text>
                        <Text style={styles.readOnlyText}>{settings?.authenticationId}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notifications</Text>

                    <View style={styles.switchField}>
                        <Text style={styles.label}>Email Notifications</Text>
                        <Switch
                            value={updatedSettings?.isEmailNotificationsEnabled}
                            onValueChange={(bool) => setUpdatedSettings({
                                ...updatedSettings,
                                isEmailNotificationsEnabled: bool,
                            })}
                            trackColor={{false: theme.disabled, true: theme.primaryLight}}
                            thumbColor={theme.text}
                        />
                    </View>

                    {useApprise && (
                        <View style={styles.field}>
                            <Text style={styles.label}>Apprise Target URL</Text>
                            <TextInput
                                style={styles.input}
                                value={settings?.appriseTarget}
                                onChangeText={(apprise) => setUpdatedSettings({
                                    ...updatedSettings,
                                    appriseTarget: apprise,
                                })}
                                placeholder="Enter Apprise target URL (optional)"
                                placeholderTextColor={theme.textTertiary}
                                autoCapitalize="none"
                                multiline={true}
                                numberOfLines={3}
                            />
                        </View>
                    )}
                </View>

                <TouchableOpacity
                    style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                    onPress={saveSettings}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color={theme.textInverse}/>
                    ) : (
                        <Text style={styles.saveButtonText}>Save Settings</Text>
                    )}
                </TouchableOpacity>

                <Link href="/profile-settings/import" asChild>
                    <TouchableOpacity style={styles.importButton}>
                        <MaterialCommunityIcons
                            name="database-import"
                            size={20}
                            color={theme.textInverse}
                            style={{marginRight: 8}}
                        />
                        <Text style={styles.importButtonText}>Import Data</Text>
                    </TouchableOpacity>
                </Link>

                <Link href="/profile-settings/approve-accounts" asChild>
                    <TouchableOpacity style={styles.approveAccountsButton}>
                        <MaterialCommunityIcons
                            name="account-check"
                            size={20}
                            color={theme.textInverse}
                            style={{marginRight: 8}}
                        />
                        <Text style={styles.approveAccountsButtonText}>Approve Accounts</Text>
                    </TouchableOpacity>
                </Link>

                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                >
                    <MaterialCommunityIcons
                        name="logout"
                        size={20}
                        color={theme.textInverse}
                        style={{marginRight: 8}}
                    />
                    <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>

                <View style={styles.apiKeySection}>
                    <Text style={styles.sectionTitle}>API Key Management</Text>

                    <TouchableOpacity
                        style={[styles.apiKeyButton, styles.createApiKeyButton]}
                        onPress={handleCreateApiKey}
                    >
                        <MaterialCommunityIcons
                            name="key-plus"
                            size={20}
                            color={theme.textInverse}
                            style={{marginRight: 8}}
                        />
                        <Text style={styles.apiKeyButtonText}>Create API Key</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.apiKeyButton, styles.evictApiKeysButton]}
                        onPress={handleEvictAllApiKeys}
                    >
                        <MaterialCommunityIcons
                            name="key-remove"
                            size={20}
                            color={theme.textInverse}
                            style={{marginRight: 8}}
                        />
                        <Text style={styles.apiKeyButtonText}>Delete All API Keys</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

const createStyles = createThemedStyles((theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    headerGradient: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 24,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 8,
        marginTop: 42,
        paddingLeft: 16,
    },
    subHeader: {
        fontSize: 14,
        color: theme.textSecondary,
        fontWeight: '400',
        paddingLeft: 16,
    },
    scrollContainer: {
        flex: 1,
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.background,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: theme.textSecondary,
    },
    section: {
        backgroundColor: theme.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: theme.shadow,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: theme.shadowOpacity,
        shadowRadius: 4,
        elevation: theme.elevation.level1,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        color: theme.text,
    },
    field: {
        marginBottom: 16,
    },
    switchField: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: theme.text,
    },
    input: {
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: theme.surface,
        color: theme.text,
    },
    readOnlyText: {
        fontSize: 16,
        color: theme.textSecondary,
        backgroundColor: theme.surfaceSecondary,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.borderSecondary,
    },
    saveButton: {
        backgroundColor: theme.primary,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 12,
        shadowColor: theme.shadow,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: theme.shadowOpacity,
        shadowRadius: 4,
        elevation: theme.elevation.level2,
    },
    saveButtonDisabled: {
        backgroundColor: theme.disabled,
    },
    saveButtonText: {
        color: theme.textInverse,
        fontSize: 16,
        fontWeight: '600',
    },
    importButton: {
        backgroundColor: theme.info,
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        marginBottom: 12,
        shadowColor: theme.shadow,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: theme.shadowOpacity,
        shadowRadius: 4,
        elevation: theme.elevation.level2,
    },
    importButtonText: {
        color: theme.textInverse,
        fontSize: 16,
        fontWeight: '600',
    },
    approveAccountsButton: {
        backgroundColor: theme.success,
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        marginBottom: 12,
        shadowColor: theme.shadow,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: theme.shadowOpacity,
        shadowRadius: 4,
        elevation: theme.elevation.level2,
    },
    approveAccountsButtonText: {
        color: theme.textInverse,
        fontSize: 16,
        fontWeight: '600',
    },
    logoutButton: {
        backgroundColor: theme.error,
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        marginBottom: 32,
        shadowColor: theme.shadow,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: theme.shadowOpacity,
        shadowRadius: 4,
        elevation: theme.elevation.level2,
    },
    logoutButtonText: {
        color: theme.textInverse,
        fontSize: 16,
        fontWeight: '600',
    },
    invitationItem: {
        backgroundColor: theme.surfaceSecondary,
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        borderLeftWidth: 3,
        borderLeftColor: theme.primary,
    },
    invitationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    habitColorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    invitationHabitName: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text,
        flex: 1,
    },
    invitationFrom: {
        fontSize: 13,
        color: theme.textSecondary,
        marginBottom: 12,
        marginLeft: 20,
    },
    invitationActions: {
        flexDirection: 'row',
        gap: 8,
    },
    invitationButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        borderRadius: 6,
        gap: 6,
    },
    acceptButton: {
        backgroundColor: theme.success,
    },
    declineButton: {
        backgroundColor: theme.error,
    },
    invitationButtonText: {
        color: theme.textInverse,
        fontSize: 14,
        fontWeight: '600',
    },
    apiKeySection: {
        backgroundColor: theme.surface,
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
        marginBottom: 32,
        shadowColor: theme.shadow,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: theme.shadowOpacity,
        shadowRadius: 4,
        elevation: theme.elevation.level1,
    },
    apiKeyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    createApiKeyButton: {
        backgroundColor: theme.surfaceTertiary,
    },
    evictApiKeysButton: {
        backgroundColor: theme.surfaceTertiary,
    },
    apiKeyButtonText: {
        color: theme.text,
        fontSize: 16,
        fontWeight: '600',
    },
}));

export default UserSettingsComponent;
