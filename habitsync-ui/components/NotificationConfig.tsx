import React, {useEffect, useState} from 'react';
import {Modal, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {useTheme} from "@/context/ThemeContext";
import {createThemedStyles} from "@/constants/styles";
import {
    FixedTimeNotificationConfigRule,
    NotificationConfig as NotificationConfigType,
    NotificationConfigRule,
    OvertakeNotificationConfigRule,
    serverConfigApi,
    ThresholdNotificationConfigRule
} from "@/services/api";
import FrequencyPicker from "./FrequencyPicker";
import alert from "@/services/alert";
import {convertUTCToLocalTime, parseTime} from "@/services/timezone";
import {MaterialCommunityIcons} from "@expo/vector-icons";
import {useUpdateNotificationForHabit} from "@/hooks/useNotifications";

const NOTIFICATION_TYPES = [
    {
        type: 'fixed' as const,
        name: 'Scheduled Notifications',
        description: 'Get notified at specific times (daily or weekly) to remind you about your habit.',
        icon: '⏰'
    },
    {
        type: 'threshold' as const,
        name: 'Threshold Notifications',
        description: 'Get notified when your habit progress falls below a certain percentage threshold.',
        icon: '📊'
    },
    {
        type: 'overtake' as const,
        name: 'Overtake Notifications',
        description: 'Get notified when someone overtakes you in shared habits.',
        icon: '🏃'
    }
];

type NotificationConfigProps = {
    habitUuid: string;
    currentConfig: NotificationConfigType | null;
    onModalClose: (notificationConfig: NotificationConfigType) => void;
};

const NotificationConfig: React.FC<NotificationConfigProps> = ({
                                                                   habitUuid,
                                                                   currentConfig,
                                                                   onModalClose
                                                               }) => {
    const {theme} = useTheme();
    const styles = createStyles(theme);

    const [loading, setLoading] = useState(false);
    const [appriseUrl, setAppriseUrl] = useState(currentConfig?.appriseTarget || '');
    const [rules, setRules] = useState<NotificationConfigRule[]>(currentConfig?.rules || []);
    const [config, setConfig] = useState<NotificationConfigType | null>(currentConfig);

    const updateNotificationForHabitMutation = useUpdateNotificationForHabit();

    // Modal states
    const [helpModalVisible, setHelpModalVisible] = useState(false);
    const [helpContent, setHelpContent] = useState('');
    const [configModalVisible, setConfigModalVisible] = useState(false);
    const [configType, setConfigType] = useState<'fixed' | 'threshold'>('fixed');

    // Config states
    const [tempFixedConfig, setTempFixedConfig] = useState<Partial<FixedTimeNotificationConfigRule>>({});
    const [tempThresholdConfig, setTempThresholdConfig] = useState<Partial<ThresholdNotificationConfigRule>>({});

    const [showAppriseField, setShowAppriseField] = useState(false);

    useEffect(() => {
        if (currentConfig) {
            setAppriseUrl(currentConfig.appriseTarget || '');
            setRules(currentConfig.rules || []);
        }
    }, [currentConfig]);

    useEffect(() => {
        const loadConfig = async () => {
            const config = await serverConfigApi.getServerConfig();
            setShowAppriseField(config.appriseActive);
        }
        loadConfig();
    }, []);

    const getRuleByType = (type: 'fixed' | 'threshold' | 'overtake') => {
        return rules.find(rule => rule.type === type);
    };

    const updateRule = (updatedRule: NotificationConfigRule): NotificationConfigRule[] => {
        const newRules = rules.filter(rule => rule.type !== updatedRule.type);
        if (updatedRule.enabled) {
            newRules.push(updatedRule);
        }
        setRules(newRules);
        return newRules;
    };

    const toggleRule = async (type: 'fixed' | 'threshold' | 'overtake', active: boolean) => {
        const existingRule = getRuleByType(type);

        if (!active) {
            // Deactivate rule
            if (existingRule) {
                const rule = updateRule({...existingRule, enabled: false});
                await saveConfig(rule);
            }
            return;
        }

        // Activate rule
        if (type === 'overtake') {
            // Overtake doesn't need additional config
            const overtakeRule: OvertakeNotificationConfigRule = {
                type: 'overtake',
                enabled: true
            };
            const rules = updateRule(overtakeRule);
            await saveConfig(rules);
        } else if (type === 'fixed') {
            // Open config modal for fixed time
            setTempFixedConfig(existingRule as FixedTimeNotificationConfigRule || {
                frequency: 'daily',
                weekdays: [],
                time: '08:00',
                triggerIfFulfilled: false,
                triggerOnlyWhenStreakLost: false,
            });
            setConfigType('fixed');
            setConfigModalVisible(true);
        } else if (type === 'threshold') {
            // Open config modal for threshold
            setTempThresholdConfig(existingRule as ThresholdNotificationConfigRule || {
                thresholdPercentage: 80
            });
            setConfigType('threshold');
            setConfigModalVisible(true);
        }
    };

    const openConfigModal = (type: 'fixed' | 'threshold') => {
        const existingRule = getRuleByType(type);

        if (type === 'fixed') {
            setTempFixedConfig(existingRule as FixedTimeNotificationConfigRule || {
                frequency: 'daily',
                weekdays: [],
                time: '08:00',
                triggerIfFulfilled: false,
                triggerOnlyWhenStreakLost: false,
            });
        } else {
            setTempThresholdConfig(existingRule as ThresholdNotificationConfigRule || {
                thresholdPercentage: 80
            });
        }

        setConfigType(type);
        setConfigModalVisible(true);
    };

    const saveRuleConfig = async () => {
        let rules;
        if (configType === 'fixed') {
            const fixedRule: FixedTimeNotificationConfigRule = {
                type: 'fixed',
                enabled: true,
                frequency: tempFixedConfig.frequency || 'daily',
                weekdays: tempFixedConfig.weekdays || [],
                time: tempFixedConfig.time || '08:00',
                triggerIfFulfilled: tempFixedConfig.triggerIfFulfilled || false,
                triggerOnlyWhenStreakLost: tempFixedConfig.triggerOnlyWhenStreakLost || false,
            };
            rules = updateRule(fixedRule);
        } else if (configType === 'threshold') {
            const thresholdRule: ThresholdNotificationConfigRule = {
                type: 'threshold',
                enabled: true,
                thresholdPercentage: tempThresholdConfig.thresholdPercentage || 80
            };
            rules = updateRule(thresholdRule);
        }

        setConfigModalVisible(false);
        await saveConfig(rules || []);
    };

    const saveConfig = async (rules: NotificationConfigRule[]) => {
        try {
            setLoading(true);

            const config: NotificationConfigType = {
                appriseTarget: appriseUrl.trim() || undefined,
                rules: rules.filter(rule => rule.enabled)
            };
            setConfig(config);

            await updateNotificationForHabitMutation.mutateAsync({habitUuid, config})
        } catch {
            alert('Error', 'Failed to update notification settings');
        } finally {
            setLoading(false);
        }
    };

    const showHelp = (description: string) => {
        setHelpContent(description);
        setHelpModalVisible(true);
    };

    const getRuleStatusText = (type: 'fixed' | 'threshold' | 'overtake') => {
        const rule = getRuleByType(type);
        if (!rule || !rule.enabled) return 'Off';

        switch (type) {
            case 'fixed':
                const fixedRule = rule as FixedTimeNotificationConfigRule;
                const {hour: utcHour, minute: utcMinute} = parseTime(fixedRule.time);
                const localTime = convertUTCToLocalTime(utcHour, utcMinute);
                return `${fixedRule.frequency === 'daily' ? 'Daily' : 'Weekly'} at ${localTime.hour}:${localTime.minute.toString().padStart(2, '0')}`;
            case 'threshold':
                const thresholdRule = rule as ThresholdNotificationConfigRule;
                return `At ${thresholdRule.thresholdPercentage}% progress`;
            case 'overtake':
                return 'Active';
            default:
                return 'Off';
        }
    };

    return (
        <View style={styles.container}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>

                <Text style={styles.title}>Notification Settings</Text>

                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => onModalClose(config)}
                >
                    <MaterialCommunityIcons name="close" size={24} color={theme.text}/>
                </TouchableOpacity>
            </View>

            {/* Apprise URL Field */}
            {showAppriseField && (
                <View style={styles.appriseContainer}>
                    <Text style={styles.appriseLabel}>Apprise URL (Optional)</Text>
                    <TextInput
                        style={styles.appriseInput}
                        value={appriseUrl}
                        onChangeText={setAppriseUrl}
                        placeholder="e.g., service://token/chat_id"
                        placeholderTextColor={theme.textTertiary}
                        autoCapitalize="none"
                        autoCorrect={false}
                        onBlur={() => saveConfig(rules)}
                    />
                </View>
            )}

            {/* Notification Rules */}
            <View style={styles.rulesContainer}>
                {NOTIFICATION_TYPES.map((notificationType) => {
                    const rule = getRuleByType(notificationType.type);
                    const isActive = rule?.enabled || false;
                    const needsConfig = notificationType.type !== 'overtake';

                    return (
                        <View key={notificationType.type} style={styles.ruleItem}>
                            <View style={styles.ruleHeader}>
                                <View style={styles.ruleInfo}>
                                    <Text style={styles.ruleIcon}>{notificationType.icon}</Text>
                                    <View style={styles.ruleText}>
                                        <Text style={styles.ruleName}>{notificationType.name}</Text>
                                        <Text style={styles.ruleStatus}>
                                            {getRuleStatusText(notificationType.type)}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.ruleControls}>
                                    <TouchableOpacity
                                        style={styles.helpButton}
                                        onPress={() => showHelp(notificationType.description)}
                                    >
                                        <Text style={styles.helpButtonText}>?</Text>
                                    </TouchableOpacity>

                                    <Switch
                                        value={isActive}
                                        onValueChange={(value) => toggleRule(notificationType.type, value)}
                                        trackColor={{false: theme.disabled, true: theme.primaryLight}}
                                        thumbColor={isActive ? theme.primary : theme.surface}
                                        disabled={loading}
                                    />

                                    {needsConfig && isActive && (
                                        <TouchableOpacity
                                            style={styles.configButton}
                                            onPress={() => openConfigModal(notificationType.type as 'fixed' | 'threshold')}
                                        >
                                            <Text style={styles.configButtonText}>⚙️</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        </View>
                    );
                })}
            </View>

            {/* Help Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={helpModalVisible}
                onRequestClose={() => setHelpModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalText}>{helpContent}</Text>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={() => setHelpModalVisible(false)}
                        >
                            <Text style={styles.modalButtonText}>Got it</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Config Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={configModalVisible}
                onRequestClose={() => setConfigModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.configModalContent}>
                        <Text style={styles.modalTitle}>
                            {configType === 'fixed' ? 'Schedule Notification' : 'Progress Threshold'}
                        </Text>

                        {configType === 'fixed' && (
                            <View style={styles.configContent}>
                                <FrequencyPicker
                                    onChange={(config) => setTempFixedConfig(prev => ({...prev, ...config}))}
                                    hideFrequency={false}
                                    hideWeekdays={false}
                                    notificationConfigRule={tempFixedConfig as FixedTimeNotificationConfigRule}
                                />

                                <View style={styles.switchContainer}>
                                    <Text style={styles.switchLabel}>Notify even if fulfilled</Text>
                                    <Switch
                                        value={tempFixedConfig.triggerIfFulfilled || false}
                                        onValueChange={(value) => setTempFixedConfig(prev => ({
                                            ...prev,
                                            triggerIfFulfilled: value,
                                            triggerOnlyWhenStreakLost: value ? false : prev.triggerOnlyWhenStreakLost
                                        }))}
                                        trackColor={{false: theme.disabled, true: theme.primaryLight}}
                                        thumbColor={tempFixedConfig.triggerIfFulfilled ? theme.primary : theme.surface}
                                    />
                                </View>
                                <View style={styles.switchContainer}>
                                    <Text style={styles.switchLabel}>Notify only when not completed by streak</Text>
                                    <Switch
                                        value={tempFixedConfig.triggerOnlyWhenStreakLost || false}
                                        onValueChange={(value) => setTempFixedConfig(prev => ({
                                            ...prev,
                                            triggerOnlyWhenStreakLost: value,
                                            triggerIfFulfilled: value ? false : prev.triggerIfFulfilled
                                        }))}
                                        trackColor={{false: theme.disabled, true: theme.primaryLight}}
                                        thumbColor={tempFixedConfig.triggerOnlyWhenStreakLost ? theme.primary : theme.surface}
                                    />
                                </View>
                            </View>
                        )}

                        {configType === 'threshold' && (
                            <View style={styles.configContent}>
                                <Text style={styles.inputLabel}>Notify when progress falls below:</Text>
                                <View style={styles.thresholdInputContainer}>
                                    <TextInput
                                        style={styles.thresholdInput}
                                        value={tempThresholdConfig.thresholdPercentage?.toString() || ''}
                                        onChangeText={(text) => {
                                            const value = parseInt(text.replace(/[^0-9]/g, ''));
                                            if (!isNaN(value) && value >= 0 && value <= 100) {
                                                setTempThresholdConfig(prev => ({...prev, thresholdPercentage: value}));
                                            }
                                        }}
                                        placeholder="80"
                                        keyboardType="numeric"
                                        maxLength={3}
                                    />
                                    <Text style={styles.percentSymbol}>%</Text>
                                </View>
                            </View>
                        )}

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalActionButton, styles.saveButton]}
                                onPress={saveRuleConfig}
                            >
                                <Text style={styles.modalButtonText}>Save</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalActionButton, styles.cancelButton]}
                                onPress={() => setConfigModalVisible(false)}
                            >
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const createStyles = createThemedStyles((theme) => StyleSheet.create({
    container: {
        backgroundColor: theme.surface,
        borderRadius: 12,
        padding: 20,
        margin: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.text,
        marginBottom: 16,
    },
    appriseContainer: {
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    appriseLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.text,
        marginBottom: 6,
    },
    appriseInput: {
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: theme.background,
        color: theme.text,
    },
    rulesContainer: {
        gap: 12,
    },
    ruleItem: {
        backgroundColor: theme.background,
        borderRadius: 8,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.border,
    },
    ruleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    ruleInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    ruleIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    ruleText: {
        flex: 1,
    },
    ruleName: {
        fontSize: 16,
        fontWeight: '500',
        color: theme.text,
        marginBottom: 2,
    },
    ruleStatus: {
        fontSize: 14,
        color: theme.textSecondary,
    },
    ruleControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    helpButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: theme.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    helpButtonText: {
        fontSize: 12,
        color: '#fff',
        fontWeight: 'bold',
    },
    configButton: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    configButtonText: {
        fontSize: 16,
    },
    deleteButton: {
        backgroundColor: theme.error,
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: 'center',
        marginTop: 20,
    },
    deleteButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
    },
    modalContent: {
        backgroundColor: theme.surfaceSecondary,
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        width: '90%',
        maxWidth: 400,
    },
    configModalContent: {
        backgroundColor: theme.surfaceSecondary,
        borderRadius: 12,
        padding: 20,
        width: '95%',
        maxWidth: 600,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.text,
        marginBottom: 16,
        textAlign: 'center',
    },
    modalText: {
        fontSize: 16,
        color: theme.text,
        lineHeight: 24,
        marginBottom: 20,
        textAlign: 'center',
    },
    modalButton: {
        backgroundColor: theme.primary,
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    configContent: {
        marginBottom: 20,
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: theme.border,
    },
    switchLabel: {
        fontSize: 16,
        color: theme.text,
        flex: 1,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: theme.text,
        marginBottom: 12,
    },
    thresholdInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    thresholdInput: {
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 8,
        padding: 12,
        fontSize: 18,
        backgroundColor: theme.background,
        color: theme.text,
        width: 80,
        textAlign: 'center',
    },
    percentSymbol: {
        fontSize: 18,
        color: theme.text,
        fontWeight: '500',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        justifyContent: 'center',
    },
    modalActionButton: {
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
        minWidth: 80,
        alignItems: 'center',
    },
    saveButton: {
        backgroundColor: theme.primary,
    },
    cancelButton: {
        backgroundColor: theme.error,
    },
    closeButton: {
        padding: 8,
    },
}));

export default NotificationConfig;
