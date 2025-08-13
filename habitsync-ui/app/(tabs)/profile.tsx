import React, {useEffect, useState} from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {ApiAccountSettingsReadWrite, userApi} from "@/services/api";
import alert from "@/services/alert";
import {AuthService} from "@/services/auth";
import {Link} from 'expo-router';
import {useTheme} from '@/context/ThemeContext';
import {createThemedStyles} from '@/constants/styles';
import ThemeToggle from '@/components/ThemeToggle';
import {MaterialCommunityIcons} from '@expo/vector-icons';


const UserSettingsComponent = () => {
    const {theme} = useTheme();
    const styles = createStyles(theme);

    const [settings, setSettings] = useState<ApiAccountSettingsReadWrite | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showHourPicker, setShowHourPicker] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [isEmailNotificationsEnabled, setIsEmailNotificationsEnabled] = useState(false);
    const [isPushNotificationsEnabled, setIsPushNotificationsEnabled] = useState(false);
    const [dailyNotificationHour, setDailyNotificationHour] = useState(9);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const userSettings = await userApi.getUserSettings();
            setSettings(userSettings);
            setDisplayName(userSettings.displayName);
            setEmail(userSettings.email);
            setIsEmailNotificationsEnabled(userSettings.isEmailNotificationsEnabled);
            setIsPushNotificationsEnabled(userSettings.isPushNotificationsEnabled);
            setDailyNotificationHour(userSettings.dailyNotificationHour);
        } catch (error) {
            Alert.alert('Error', 'Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async () => {
        if (!settings) return;

        try {
            setSaving(true);
            const updatedSettings = {
                ...settings,
                displayName,
                email,
                isEmailNotificationsEnabled,
                isPushNotificationsEnabled,
                dailyNotificationHour,
            };

            await userApi.updateUserSettings(updatedSettings);
            alert('Success', 'Settings updated successfully');
        } catch (error) {
            alert('Error', 'Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        await AuthService.getInstance().logout();
    };

    const handleHourChange = (hour: React.SetStateAction<number>) => {
        setDailyNotificationHour(hour);
        setShowHourPicker(false);
    };

    const hours = Array.from({length: 24}, (_, i) => i);

    const renderHourItem = ({item}: {item: number}) => (
        <TouchableOpacity
            style={[
                styles.hourItem,
                item === dailyNotificationHour && styles.selectedHourItem
            ]}
            onPress={() => handleHourChange(item)}
        >
            <Text style={[
                styles.hourText,
                item === dailyNotificationHour && styles.selectedHourText
            ]}>
                {item.toString().padStart(2, '0')}:00
            </Text>
        </TouchableOpacity>
    );

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
            <View
                style={styles.header}
            >
                <Text style={styles.header}>Profile & Settings</Text>
                <Text style={styles.subHeader}>Manage your account preferences</Text>
            </View>

            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                {/* Theme Settings Section */}
                <ThemeToggle />

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account Information</Text>

                    <View style={styles.field}>
                        <Text style={styles.label}>Display Name</Text>
                        <TextInput
                            style={styles.input}
                            value={displayName}
                            onChangeText={setDisplayName}
                            placeholder="Enter display name"
                            placeholderTextColor={theme.textTertiary}
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
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
                            value={isEmailNotificationsEnabled}
                            onValueChange={setIsEmailNotificationsEnabled}
                            trackColor={{ false: theme.disabled, true: theme.primaryLight }}
                            thumbColor={isEmailNotificationsEnabled ? theme.primary : theme.surface}
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Daily Notification Hour</Text>
                        <TouchableOpacity
                            style={styles.hourSelector}
                            onPress={() => setShowHourPicker(true)}
                        >
                            <Text style={styles.hourSelectorText}>
                                {dailyNotificationHour.toString().padStart(2, '0')}:00
                            </Text>
                            <MaterialCommunityIcons
                                name="chevron-down"
                                size={20}
                                color={theme.textSecondary}
                            />
                        </TouchableOpacity>
                    </View>
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
            </ScrollView>

            <Modal
                visible={showHourPicker}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowHourPicker(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Hour</Text>
                            <TouchableOpacity onPress={() => setShowHourPicker(false)}>
                                <Text style={styles.closeButton}>Done</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={hours}
                            renderItem={renderHourItem}
                            keyExtractor={(item) => item.toString()}
                            showsVerticalScrollIndicator={false}
                            style={styles.hourList}
                        />
                    </View>
                </View>
            </Modal>
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
        marginTop: 16,
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
    hourSelector: {
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 8,
        padding: 12,
        backgroundColor: theme.surface,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    hourSelectorText: {
        fontSize: 16,
        color: theme.text,
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: theme.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '50%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.text,
    },
    closeButton: {
        fontSize: 16,
        color: theme.primary,
        fontWeight: '600',
    },
    hourList: {
        maxHeight: 300,
    },
    hourItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.borderSecondary,
        alignItems: 'center',
    },
    selectedHourItem: {
        backgroundColor: theme.primary,
    },
    hourText: {
        fontSize: 16,
        color: theme.text,
    },
    selectedHourText: {
        color: theme.textInverse,
        fontWeight: '600',
    },
}));

export default UserSettingsComponent;
