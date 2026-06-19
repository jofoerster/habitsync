import React, {forwardRef, useEffect, useImperativeHandle, useState} from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Modal,
    Platform,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import {useNavigation} from "@react-navigation/native";
import {useTranslation} from 'react-i18next';
import {
    ApiComputationReadWrite,
    ApiHabitRead,
    ApiHabitWrite,
    ChallengeComputationType,
    FrequencyTypeDTO,
    NotificationConfig as NotificationConfigType
} from "@/services/api";
import {COLOR_OPTIONS} from "@/constants/colors";
import alert from "@/services/alert";
import {useTheme} from "@/context/ThemeContext";
import {createThemedStyles} from "@/constants/styles";
import {MAX_INTEGER} from "@/constants/numbers";
import {useHabitGroupNames} from "@/hooks/useHabits";

const {width} = Dimensions.get('window');

export enum ConfigType {
    HABIT, SHARED_HABIT, CHALLENGE
}

const FREQUENCY_OPTIONS = [
    {value: FrequencyTypeDTO.DAILY, labelKey: 'habitConfig.frequencyDaily'},
    {value: FrequencyTypeDTO.WEEKLY, labelKey: 'habitConfig.frequencyWeekly'},
    {value: FrequencyTypeDTO.MONTHLY, labelKey: 'habitConfig.frequencyMonthly'},
    {value: FrequencyTypeDTO.X_TIMES_PER_Y_DAYS, labelKey: 'habitConfig.frequencyCustomPeriod'}
];

const CHALLENGE_COMPUTATION_OPTIONS = [
    {value: ChallengeComputationType.ABSOLUTE, labelKey: 'habitConfig.challengeAbsolutePercentage'},
    {
        value: ChallengeComputationType.RELATIVE,
        labelKey: 'habitConfig.challengeRelativePercentage'
    },
    {value: ChallengeComputationType.MAX_VALUE, labelKey: 'habitConfig.challengeHighestValue'},
];

const TOOLTIP_KEYS = {
    habitType: 'habitConfig.tooltipHabitType',
    dailyGoal: 'habitConfig.tooltipDailyGoal',
    maxDailyValue: 'habitConfig.tooltipMaxDailyValue',
    maxDailyValueNegative: 'habitConfig.tooltipMaxDailyValueNegative',
    unit: 'habitConfig.tooltipUnit',
    targetDays: 'habitConfig.tooltipTargetDays',
    isNegative: 'habitConfig.tooltipIsNegative',
    challengeComputation: 'habitConfig.tooltipChallengeComputation',
    frequencySettings: 'habitConfig.tooltipFrequencySettings',
    frequencyType: 'habitConfig.tooltipFrequencyType',
    frequency: 'habitConfig.tooltipFrequency',
    customDays: 'habitConfig.tooltipCustomDays',
    asMuchAsPossible: 'habitConfig.tooltipAsMuchAsPossible',
    weekdayFilter: 'habitConfig.tooltipWeekdayFilter'
} as const;

type HabitConfigProps = {
    habit?: ApiHabitRead;
    configType: ConfigType;
    callbackMethod?: (habitWrite: ApiHabitWrite) => void | Promise<void>;
    showSaveButton?: boolean;
};

export interface HabitConfigRef {
    save: () => Promise<ApiHabitWrite | undefined>;
}

const HabitConfig = forwardRef<HabitConfigRef, HabitConfigProps>(
    ({habit, configType, callbackMethod, showSaveButton = true}, ref) => {
        const {theme} = useTheme();
        const {t} = useTranslation();
        const styles = createStyles(theme);

        const navigation = useNavigation();

        const [loading, setLoading] = useState(true);
        const [saving, setSaving] = useState(false);

        const [name, setName] = useState('');
        const [group, setGroup] = useState('');
        const [selectedColor, setSelectedColor] = useState<number>(1);
        const [dailyDefault, setDailyDefault] = useState('');
        const [dailyReachableValue, setDailyReachableValue] = useState('1');
        const [unit, setUnit] = useState('');
        const [targetDays, setTargetDays] = useState('30');
        const [frequencyType, setFrequencyType] = useState<FrequencyTypeDTO>(FrequencyTypeDTO.DAILY);
        const [challengeType, setChallengeType] = useState<ChallengeComputationType>(ChallengeComputationType.ABSOLUTE);
        const [frequency, setFrequency] = useState('');
        const [timesPerXDays, setTimesPerXDays] = useState('');

        const [isNumericalHabit, setIsNumericalHabit] = useState(false);
        const [isNegative, setIsNegative] = useState(false);

        const [isSharedWithOthers, setIsSharedWithOthers] = useState(false);
        const [modalVisible, setModalVisible] = useState(false);
        const [modalContent, setModalContent] = useState('');

        const [frequencyModalVisible, setFrequencyModalVisible] = useState(false);
        const [tempFrequencyType, setTempFrequencyType] = useState<FrequencyTypeDTO>(FrequencyTypeDTO.WEEKLY);
        const [tempFrequency, setTempFrequency] = useState('');
        const [tempTimesPerXDays, setTempTimesPerXDays] = useState('');

        const [isAsMuchAsPossibleChallenge, setIsAsMuchAsPossibleChallenge] = useState(false);

        const [notificationFrequency, setNotificationFrequency] = useState<NotificationConfigType | null>(null);

        const [goalType, setGoalType] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');

        const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);

        const {data: groupNames = []} = useHabitGroupNames();

        const calculateDefaultTargetDays = (freqType: FrequencyTypeDTO, freqValue: string, customDays: string): number => {
            let periodInDays = 1;

            if (freqType === FrequencyTypeDTO.WEEKLY) {
                periodInDays = 7;
            } else if (freqType === FrequencyTypeDTO.MONTHLY) {
                periodInDays = 30;
            } else if (freqType === FrequencyTypeDTO.X_TIMES_PER_Y_DAYS && customDays) {
                periodInDays = parseInt(customDays) || 1;
            }

            return Math.max(30, periodInDays * 3);
        };

        const getFrequencyDisplay = () => {
            if (frequencyType === FrequencyTypeDTO.X_TIMES_PER_Y_DAYS &&
                frequency === '1' && timesPerXDays === '1') {
                return t('habitConfig.frequencyDaily');
            } else if (frequencyType === FrequencyTypeDTO.WEEKLY) {
                return frequency ? t('habitConfig.timesPerWeekCount', {count: frequency}) : t('habitConfig.frequencyDaily');
            } else if (frequencyType === FrequencyTypeDTO.MONTHLY) {
                return frequency ? t('habitConfig.timesPerMonthCount', {count: frequency}) : t('habitConfig.frequencyMonthly');
            } else if (frequencyType === FrequencyTypeDTO.X_TIMES_PER_Y_DAYS) {
                return frequency && timesPerXDays ? t('habitConfig.timesPerXDaysCount', {count: frequency, days: timesPerXDays}) : t('habitConfig.frequencyCustom');
            }
            return t('habitConfig.frequencyDaily');
        };

        const openFrequencyModal = () => {
            setTempFrequencyType(frequencyType);
            setTempFrequency(frequency);
            setTempTimesPerXDays(timesPerXDays);
            setFrequencyModalVisible(true);
        };

        const applyFrequencyChanges = () => {
            if (tempFrequencyType !== FrequencyTypeDTO.X_TIMES_PER_Y_DAYS || parseInt(tempFrequency) <= parseInt(tempTimesPerXDays)) {
                setFrequencyType(tempFrequencyType);
                setFrequency(tempFrequency);
                setTimesPerXDays(tempTimesPerXDays);

                if (!habit?.uuid && configType !== ConfigType.CHALLENGE) {
                    const newTargetDays = calculateDefaultTargetDays(tempFrequencyType, tempFrequency, tempTimesPerXDays);
                    setTargetDays(newTargetDays.toString());
                }

                setFrequencyModalVisible(false);
            }
        };


        const rotateGoalType = () => {
            const types = ['Daily', 'Weekly', 'Monthly'];
            const currentIndex = types.indexOf(goalType);
            const possibleNewType = types[(currentIndex + 1) % types.length] as 'Daily' | 'Weekly' | 'Monthly'
            const newType =
                configType === ConfigType.CHALLENGE && possibleNewType === "Weekly" ? "Monthly" as 'Daily' | 'Weekly' | 'Monthly'
                    : possibleNewType;
            setGoalType(newType);

            if (isNegative && newType !== 'Daily') {
                setFrequency("0"); // For negative habits, set to 0 for Weekly/Monthly to enable week/month completion
                console.log("Set frequency to 0 for negative habit with type ", newType);
            } else {
                setFrequency("1");
            }
            if (newType === 'Weekly') {
                setFrequencyType(FrequencyTypeDTO.WEEKLY)
            }
            if (newType === 'Monthly') {
                setFrequencyType(FrequencyTypeDTO.MONTHLY)
            }
            if (newType === 'Daily') {
                setFrequencyType(FrequencyTypeDTO.DAILY)
            }

            if (!habit?.uuid && configType !== ConfigType.CHALLENGE) {
                let newFreqType = FrequencyTypeDTO.DAILY;
                if (newType === 'Weekly') {
                    newFreqType = FrequencyTypeDTO.WEEKLY;
                } else if (newType === 'Monthly') {
                    newFreqType = FrequencyTypeDTO.MONTHLY;
                }
                const newTargetDays = calculateDefaultTargetDays(newFreqType, "1", "");
                setTargetDays(newTargetDays.toString());
            }
        }

        const isFieldLocked = () => {
            return isSharedWithOthers;
        };

        const LockIcon = () => (
            <Text style={styles.lockIcon}>🔒</Text>
        );

        const HelpIcon = ({tooltipKey}: { tooltipKey: keyof typeof TOOLTIP_KEYS }) => (
            <TouchableOpacity
                style={styles.helpIcon}
                onPress={() => {
                    setModalContent(t(TOOLTIP_KEYS[tooltipKey]));
                    setModalVisible(true);
                }}
            >
                <Text style={styles.helpIconText}>?</Text>
            </TouchableOpacity>
        );

        useImperativeHandle(ref, () => ({
            save: async () => {
                return await handleUpdate();
            }
        }));

        useEffect(() => {
            const readHabit = async () => {
                try {
                    if (habit) {
                        setName(habit.name);
                        setSelectedColor(habit.color);
                        setDailyDefault(habit.progressComputation.dailyDefault.toString());
                        setDailyReachableValue(habit.progressComputation.dailyReachableValue?.toString() || '');
                        setUnit(habit.progressComputation.unit || '');
                        setTargetDays(habit.progressComputation.targetDays.toString());
                        setFrequencyType(habit.progressComputation.frequencyType);
                        setFrequency(habit.progressComputation.frequency.toString());
                        setTimesPerXDays(habit.progressComputation.timesPerXDays?.toString() || '');
                        setIsSharedWithOthers(!(habit.synchronizedSharedHabitId === undefined
                            || habit.synchronizedSharedHabitId === null));
                        setIsNumericalHabit(habit.progressComputation.dailyReachableValue !== 1);
                        setIsNegative(habit.progressComputation.isNegative || false);
                        setIsAsMuchAsPossibleChallenge(configType === ConfigType.CHALLENGE
                            && parseInt(habit.progressComputation.dailyReachableValue?.toString() || '0') >= (MAX_INTEGER - 1));
                        setNotificationFrequency(habit.notificationFrequency);
                        setSelectedWeekdays(habit.progressComputation.weekdayFilterWhitelist || []);
                        setGroup(habit.group || "");
                    }
                    if (configType === ConfigType.CHALLENGE) {
                        setChallengeType(habit?.progressComputation.challengeComputationType || ChallengeComputationType.ABSOLUTE);
                        setFrequencyType(FrequencyTypeDTO.MONTHLY);
                        setTargetDays('31');
                    }
                    if (((habit?.progressComputation.frequency === 1 && !habit?.progressComputation.isNegative)
                            || habit?.progressComputation.frequency === 0)
                        && habit?.progressComputation.dailyReachableValue !== 1) {
                        if (habit.progressComputation.frequencyType === FrequencyTypeDTO.WEEKLY) {
                            setGoalType('Weekly');
                        } else if (habit.progressComputation.frequencyType === FrequencyTypeDTO.MONTHLY) {
                            setGoalType('Monthly');
                        }
                    }
                    setLoading(false);
                } catch (_error) {
                    alert(t('common.error'), t('habitConfig.errorFetchHabit'));
                    navigation.goBack();
                }
            };

            readHabit();
        }, [habit?.uuid, configType, navigation]);

        const switchNumericalBooleanHabit = (value: boolean) => {
            setIsNumericalHabit(value);
            if (!value) {
                setDailyDefault('1');
                setUnit('');
                setIsAsMuchAsPossibleChallenge(false);
                if (!isNegative) {
                    setDailyReachableValue('1');
                } else {
                    setDailyReachableValue('0');
                    setDailyDefault("1");
                }
            }
        };

        const switchNegativeHabit = (value: boolean) => {
            setIsNegative(value);
            if (value) {
                setDailyReachableValue('0');
                setDailyDefault("1");
            } else {
                setDailyReachableValue('1');
            }
        };

        const switchAsMuchAsPossibleChallenge = () => {
            setIsAsMuchAsPossibleChallenge(!isAsMuchAsPossibleChallenge);
            if (!isAsMuchAsPossibleChallenge) {
                setDailyReachableValue(MAX_INTEGER.toString());
                setFrequencyType(FrequencyTypeDTO.MONTHLY);
                setFrequency("1");
                setChallengeType(ChallengeComputationType.RELATIVE);
            } else {
                setDailyReachableValue('1');
                setChallengeType(ChallengeComputationType.ABSOLUTE);
            }
        }

        const toggleWeekday = (day: number) => {
            if (isFieldLocked()) return;

            setSelectedWeekdays(prev => {
                if (prev.includes(day)) {
                    if (prev.length > 1) {
                        setFrequencyType(FrequencyTypeDTO.WEEKLY);
                        setFrequency((prev.length - 1).toString())
                        setGoalType('Daily');

                        if (!habit?.uuid && configType !== ConfigType.CHALLENGE) {
                            const newTargetDays = calculateDefaultTargetDays(FrequencyTypeDTO.WEEKLY, (prev.length - 1).toString(), "");
                            setTargetDays(newTargetDays.toString());
                        }
                    }
                    return prev.filter(d => d !== day);
                } else {
                    setFrequencyType(FrequencyTypeDTO.WEEKLY);
                    setFrequency((prev.length + 1).toString());
                    setGoalType('Daily');

                    if (!habit?.uuid && configType !== ConfigType.CHALLENGE) {
                        const newTargetDays = calculateDefaultTargetDays(FrequencyTypeDTO.WEEKLY, (prev.length + 1).toString(), "");
                        setTargetDays(newTargetDays.toString());
                    }

                    return [...prev, day].sort();
                }
            });
        };

        const handleUpdate = async (): Promise<ApiHabitWrite | undefined> => {
            if (configType === ConfigType.HABIT && !name.trim()) {
                alert(t('common.error'), t('habitConfig.errorNameRequired'));
                return;
            }

            if (!dailyReachableValue) {
                alert(t('common.error'), t('habitConfig.errorDailyGoalRequired'));
                return;
            }

            if (!targetDays) {
                alert(t('common.error'), t('habitConfig.errorTargetDaysRequired'));
                return;
            }

            if (!dailyDefault) {
                setDailyDefault(dailyReachableValue);
            }

            if (((!frequency && configType !== ConfigType.CHALLENGE) ||
                    (!frequency && configType === ConfigType.CHALLENGE && challengeType !== ChallengeComputationType.MAX_VALUE)) &&
                frequencyType !== FrequencyTypeDTO.DAILY) {
                alert(t('common.error'), t('habitConfig.errorFrequencyRequired'));
                return;
            }

            if (frequencyType === FrequencyTypeDTO.X_TIMES_PER_Y_DAYS && !timesPerXDays) {
                alert(t('common.error'), t('habitConfig.errorTimesPerXDaysRequired'));
                return;
            }

            if (configType === ConfigType.CHALLENGE && !challengeType) {
                alert(t('common.error'), t('habitConfig.errorChallengeTypeRequired'));
                return;
            }

            try {
                setSaving(true);

                let computedTimesPerXDays = undefined;
                if (frequencyType === FrequencyTypeDTO.DAILY) {
                    computedTimesPerXDays = 1;
                } else if (frequencyType === FrequencyTypeDTO.X_TIMES_PER_Y_DAYS) {
                    computedTimesPerXDays = parseInt(timesPerXDays);
                }

                const progressComputation: ApiComputationReadWrite = {
                    dailyDefault: dailyDefault,
                    dailyReachableValue: parseFloat(dailyReachableValue),
                    unit: unit.trim() || undefined,
                    targetDays: parseInt(targetDays),
                    frequencyType: frequencyType === FrequencyTypeDTO.DAILY ? FrequencyTypeDTO.X_TIMES_PER_Y_DAYS : frequencyType,
                    frequency: frequencyType === FrequencyTypeDTO.DAILY ? 1 : parseInt(frequency),
                    timesPerXDays: computedTimesPerXDays,
                    challengeComputationType: challengeType,
                    isNegative: isNegative,
                    weekdayFilterWhitelist: selectedWeekdays
                };

                const habitData: ApiHabitWrite = {
                    uuid: habit?.uuid,
                    name: name.trim(),
                    group: group.trim() || undefined,
                    color: selectedColor,
                    progressComputation
                };

                if (callbackMethod) {
                    await callbackMethod(habitData);
                }
                setSaving(false);
                return habitData;
            } catch (_error) {
                alert(t('common.error'), t('habitConfig.errorUpdateHabit'));
                setSaving(false);
            }
        };

        if (loading) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4ECDC4"/>
                    <Text style={styles.loadingText}>{t('habitConfig.loadingHabit')}</Text>
                </View>
            );
        }

        return (
            <>
                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalText}>{modalContent}</Text>
                            <TouchableOpacity
                                style={styles.modalButton}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.modalButtonText}>{t('habitConfig.gotIt')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={frequencyModalVisible}
                    onRequestClose={() => setFrequencyModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalText}>{t('habitConfig.setFrequency')}</Text>

                            <View style={styles.inputContainer}>
                                <View style={styles.labelRow}>
                                    <Text style={styles.label}>{t('habitConfig.frequencyType')}</Text>
                                </View>
                                <View style={styles.frequencyButtons}>
                                    {FREQUENCY_OPTIONS.filter(o => (configType !== ConfigType.CHALLENGE) ||
                                        (o.value !== FrequencyTypeDTO.WEEKLY)).map((option) => (
                                        <TouchableOpacity
                                            key={option.value}
                                            style={[
                                                styles.frequencyButton,
                                                tempFrequencyType === option.value && styles.selectedFrequencyButton
                                            ]}
                                            onPress={() => setTempFrequencyType(option.value)}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={[
                                                styles.frequencyButtonText,
                                                tempFrequencyType === option.value && styles.selectedFrequencyButtonText
                                            ]}>
                                                {t(option.labelKey)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                            {tempFrequencyType !== FrequencyTypeDTO.DAILY && (
                                <View style={[styles.inputContainer, {marginBottom: 5}]}>
                                    <TextInput
                                        style={[styles.input, tempFrequencyType === FrequencyTypeDTO.X_TIMES_PER_Y_DAYS && tempTimesPerXDays &&
                                        parseInt(tempFrequency) > parseInt(tempTimesPerXDays) && {color: "red"}]}
                                        value={tempFrequency}
                                        onChangeText={(text) => {
                                            const numericValue = text.replace(/[^0-9.]/g, '');
                                            setTempFrequency(numericValue);
                                        }}
                                        placeholder={t('habitConfig.enterFrequency')}
                                        placeholderTextColor="#999"
                                        keyboardType="numeric"
                                    />
                                    <Text style={[styles.label, {paddingTop: 10, paddingLeft: 10}]}>
                                        {tempFrequencyType === FrequencyTypeDTO.WEEKLY ? t('habitConfig.timesPerWeek') :
                                            tempFrequencyType === FrequencyTypeDTO.MONTHLY ? t('habitConfig.timesPerMonth') :
                                                t('habitConfig.timesPer')}
                                    </Text>
                                </View>
                            )}

                            {tempFrequencyType === FrequencyTypeDTO.X_TIMES_PER_Y_DAYS && (
                                <View style={[styles.inputContainer, {marginBottom: 5}]}>
                                    <TextInput
                                        style={styles.input}
                                        value={tempTimesPerXDays}
                                        onChangeText={setTempTimesPerXDays}
                                        placeholder={t('habitConfig.enterNumberOfDays')}
                                        placeholderTextColor="#999"
                                        keyboardType="numeric"
                                    />
                                    <Text style={[styles.label, {paddingTop: 10, paddingLeft: 10}]}>{t('habitConfig.days')}</Text>
                                </View>
                            )}

                            <TouchableOpacity
                                style={[styles.saveButton, {backgroundColor: '#4ECDC4'}]}
                                onPress={applyFrequencyChanges}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.saveButtonText}>{t('habitConfig.applyFrequency')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.saveButton, {backgroundColor: '#e53e3e'}]}
                                onPress={() => setFrequencyModalVisible(false)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.saveButtonText}>{t('common.cancel')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>


                {isSharedWithOthers && (
                    <View style={styles.syncInfoContainer}>
                        <Text style={styles.syncInfoText}>
                            {'🔒 ' + t('habitConfig.syncInfo')}
                        </Text>
                    </View>
                )}

                {configType === ConfigType.HABIT && (
                    <View style={styles.section}>
                        <View style={styles.titleRow}>
                            <Text style={styles.sectionTitle}>{t('habitConfig.habitName')}</Text>
                            {isFieldLocked() && <LockIcon/>}
                        </View>
                        <TextInput
                            style={[styles.input, isFieldLocked() && styles.lockedInput]}
                            value={name}
                            onChangeText={isFieldLocked() ? undefined : setName}
                            placeholder={t('habitConfig.enterHabitName')}
                            placeholderTextColor="#999"
                            editable={!isFieldLocked()}
                        />
                    </View>
                )}

                {configType === ConfigType.HABIT && (
                    <View style={styles.section}>
                        <View style={styles.titleRow}>
                            <Text style={styles.sectionTitle}>{t('habitConfig.colorTheme')}</Text>
                        </View>
                        <View style={styles.colorGrid}>
                            {COLOR_OPTIONS.map((colorOption) => (
                                <TouchableOpacity
                                    key={colorOption.id}
                                    style={[
                                        styles.colorOption,
                                        {backgroundColor: colorOption.color},
                                        selectedColor === colorOption.id && styles.selectedColorOption,
                                    ]}
                                    onPress={() => setSelectedColor(colorOption.id)}
                                    activeOpacity={0.7}
                                >
                                    {selectedColor === colorOption.id && (
                                        <View style={styles.checkmark}>
                                            <Text style={styles.checkmarkText}>✓</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {
                    configType === ConfigType.CHALLENGE && !isAsMuchAsPossibleChallenge && (
                        <View style={styles.section}>
                            <View style={styles.titleRow}>
                                <Text style={styles.sectionTitle}>{t('habitConfig.challengeComputationType')}</Text>
                                <HelpIcon tooltipKey="challengeComputation"/>
                            </View>
                            <View style={styles.inputContainer}>
                                <View style={styles.frequencyButtons}>
                                    {CHALLENGE_COMPUTATION_OPTIONS.map((option) => (
                                        <TouchableOpacity
                                            key={option.value}
                                            style={[
                                                styles.frequencyButton,
                                                challengeType === option.value && styles.selectedFrequencyButton
                                            ]}
                                            onPress={() => setChallengeType(option.value)}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={[
                                                styles.frequencyButtonText,
                                                challengeType === option.value && styles.selectedFrequencyButtonText
                                            ]}>
                                                {t(option.labelKey)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>
                    )
                }


                {/* Goal Configuration */}
                <View style={styles.section}>
                    <View style={styles.titleRow}>
                        <Text style={styles.sectionTitle}>{t('habitConfig.goalConfiguration')}</Text>
                    </View>

                    {!challengeType || challengeType !== ChallengeComputationType.MAX_VALUE && (
                        <View style={styles.inputContainer}>
                            <View style={styles.labelRow}>
                                <Text style={styles.label}>{t('habitConfig.habitType')}</Text>
                                <HelpIcon tooltipKey="habitType"/>
                                {isFieldLocked() && <LockIcon/>}
                            </View>
                            <View style={styles.habitTypeContainer}>
                                <TouchableOpacity
                                    style={[
                                        styles.habitTypeButton,
                                        !isNumericalHabit && styles.selectedHabitTypeButton
                                    ]}
                                    onPress={() => isFieldLocked() ? {} : switchNumericalBooleanHabit(false)}
                                >
                                    <Text style={[
                                        styles.habitTypeButtonText,
                                        !isNumericalHabit && styles.selectedHabitTypeButtonText
                                    ]}>{t('habitConfig.yesNo')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.habitTypeButton,
                                        isNumericalHabit && styles.selectedHabitTypeButton
                                    ]}
                                    onPress={() => isFieldLocked() ? {} : switchNumericalBooleanHabit(true)}
                                >
                                    <Text style={[
                                        styles.habitTypeButtonText,
                                        isNumericalHabit && styles.selectedHabitTypeButtonText
                                    ]}>{t('habitConfig.numerical')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    <View style={styles.inputContainer}>
                        <View style={styles.labelRow}>
                            <Text style={styles.label}>{t('habitConfig.negativeHabit')}</Text>
                            <HelpIcon tooltipKey="isNegative"/>
                            {isFieldLocked() && <LockIcon/>}
                        </View>
                        <Switch
                            value={isNegative}
                            onValueChange={switchNegativeHabit}
                            disabled={isFieldLocked()}
                            trackColor={{false: theme.disabled, true: theme.primaryLight}}
                            thumbColor={theme.primary}
                        />
                    </View>

                    {challengeType !== ChallengeComputationType.MAX_VALUE && (

                        <View style={styles.row}>
                            {isNumericalHabit && configType === ConfigType.CHALLENGE && (
                                <View style={styles.halfInput}>
                                    <View style={styles.labelRow}>
                                        <Text style={styles.label}>{t('habitConfig.asMuchAsPossible')}</Text>
                                        <HelpIcon tooltipKey="asMuchAsPossible"/>
                                        {isFieldLocked() && <LockIcon/>}
                                    </View>
                                    <Switch
                                        value={isAsMuchAsPossibleChallenge}
                                        onValueChange={switchAsMuchAsPossibleChallenge}
                                        disabled={isFieldLocked()}
                                        trackColor={{false: theme.disabled, true: theme.primaryLight}}
                                        thumbColor={theme.primary}
                                    />
                                </View>
                            )}

                            {isNumericalHabit && !isAsMuchAsPossibleChallenge && (
                                <View style={styles.halfInput}>
                                    <View style={styles.labelRow}>
                                        <View style={styles.labelWithClickable}>
                                            <TouchableOpacity
                                                style={!isFieldLocked() && styles.clickableWord}
                                                onPress={!isFieldLocked() ? rotateGoalType : () => {
                                                }}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={[styles.label, styles.clickableText]}>{t('habitConfig.goalType_' + goalType)}</Text>
                                            </TouchableOpacity>
                                            <Text style={styles.label}> {isNegative ? t('habitConfig.max') : t('habitConfig.goal')}</Text>
                                        </View>
                                        {!isNegative ? (<HelpIcon tooltipKey="maxDailyValue"/>) : (
                                            <HelpIcon tooltipKey="maxDailyValueNegative"/>)}
                                        {isFieldLocked() && <LockIcon/>}
                                    </View>
                                    <TextInput
                                        style={[styles.input, isFieldLocked() && styles.lockedInput]}
                                        value={dailyReachableValue}
                                        onChangeText={isFieldLocked() ? undefined : (text) => {
                                            const numericValue = text.replace(/[^0-9.+-]/g, '');
                                            setDailyReachableValue(numericValue);
                                        }}
                                        placeholder="0"
                                        placeholderTextColor="#999"
                                        keyboardType="numeric"
                                        editable={!isFieldLocked()}
                                    />
                                </View>
                            )}

                            {configType !== ConfigType.CHALLENGE && isNumericalHabit && (
                                <View style={styles.halfInput}>
                                    <View style={styles.labelRow}>
                                        <Text style={styles.label}>{t('habitConfig.oneClickValue')}</Text>
                                        <HelpIcon tooltipKey="dailyGoal"/>
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        value={dailyDefault}
                                        onChangeText={(text) => {
                                            const numericValue = text.replace(/[^0-9.+-]/g, '');
                                            setDailyDefault(numericValue);
                                        }}
                                        placeholder="0"
                                        placeholderTextColor="#999"
                                    />
                                </View>
                            )}
                        </View>
                    )}

                    {(isNumericalHabit || challengeType === ChallengeComputationType.MAX_VALUE) && (
                        <View style={styles.inputContainer}>
                            <View style={styles.labelRow}>
                                <Text style={styles.label}>{t('habitConfig.unitOptional')}</Text>
                                <HelpIcon tooltipKey="unit"/>
                                {isFieldLocked() && <LockIcon/>}
                            </View>
                            <TextInput
                                style={[styles.input, isFieldLocked() && styles.lockedInput]}
                                value={unit}
                                onChangeText={isFieldLocked() ? undefined : setUnit}
                                placeholder={t('habitConfig.unitPlaceholder')}
                                placeholderTextColor="#999"
                                editable={!isFieldLocked()}
                            />
                        </View>
                    )}

                    {(configType !== ConfigType.CHALLENGE || challengeType !== ChallengeComputationType.MAX_VALUE)
                        && !isAsMuchAsPossibleChallenge && goalType === "Daily" && (
                            <View style={styles.inputContainer}>
                                <View style={styles.labelRow}>
                                    <Text style={styles.label}>{t('habitConfig.frequency')}</Text>
                                    <HelpIcon tooltipKey="frequencySettings"/>
                                    {isFieldLocked() && <LockIcon/>}
                                </View>
                                <TouchableOpacity
                                    style={[
                                        styles.frequencyDisplayButton,
                                        isFieldLocked() && styles.lockedInput
                                    ]}
                                    onPress={isFieldLocked() ? undefined : openFrequencyModal}
                                    disabled={isFieldLocked()}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[
                                        styles.frequencyDisplayText,
                                        isFieldLocked() && styles.lockedButtonText
                                    ]}>
                                        {getFrequencyDisplay()}
                                    </Text>
                                    {!isFieldLocked() && (
                                        <Text style={styles.editIcon}>✏️</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}

                    {configType !== ConfigType.CHALLENGE && (
                        <View style={styles.inputContainer}>
                            <View style={styles.labelRow}>
                                <Text style={styles.label}>{t('habitConfig.targetDaysAdvanced')}</Text>
                                <HelpIcon tooltipKey="targetDays"/>
                                {isFieldLocked() && <LockIcon/>}
                            </View>
                            <TextInput
                                style={[styles.input, isFieldLocked() && styles.lockedInput]}
                                value={targetDays}
                                onChangeText={isFieldLocked() ? undefined : (text) => {
                                    const numericValue = text.replace(/[^0-9.]/g, '');
                                    setTargetDays(numericValue);
                                }}
                                placeholder="30"
                                placeholderTextColor="#999"
                                keyboardType="numeric"
                                editable={!isFieldLocked()}
                            />
                        </View>
                    )}
                    <View style={styles.labelRow}>
                        <Text style={styles.label}>{t('habitConfig.weekdayFilterOptional')}</Text>
                        <HelpIcon tooltipKey="weekdayFilter"/>
                        {isFieldLocked() && <LockIcon/>}
                    </View>
                    <View style={styles.weekdayContainer}>
                        {[
                            {day: 1, labelKey: 'habitConfig.weekdayMon'},
                            {day: 2, labelKey: 'habitConfig.weekdayTue'},
                            {day: 3, labelKey: 'habitConfig.weekdayWed'},
                            {day: 4, labelKey: 'habitConfig.weekdayThu'},
                            {day: 5, labelKey: 'habitConfig.weekdayFri'},
                            {day: 6, labelKey: 'habitConfig.weekdaySat'},
                            {day: 7, labelKey: 'habitConfig.weekdaySun'}
                        ].map(({day, labelKey}) => (
                            <TouchableOpacity
                                key={day}
                                style={[
                                    styles.weekdayButton,
                                    selectedWeekdays.includes(day) && styles.selectedWeekdayButton,
                                ]}
                                onPress={() => toggleWeekday(day)}
                                disabled={isFieldLocked()}
                                activeOpacity={0.7}
                            >
                                <Text style={[
                                    styles.weekdayButtonText,
                                    selectedWeekdays.includes(day) && styles.selectedWeekdayButtonText,
                                    isFieldLocked() && styles.lockedButtonText
                                ]}>
                                    {t(labelKey)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {configType === ConfigType.HABIT && (
                    <View style={styles.section}>
                        <View style={styles.titleRow}>
                            <Text style={styles.sectionTitle}>{t('habitConfig.habitGroup')}</Text>
                        </View>
                        <View>
                            {groupNames.length > 0 && (
                                <View style={styles.dropdownContainer}>
                                    <Text style={[styles.label, {marginBottom: 8}]}>{t('habitConfig.selectFromExistingGroups')}</Text>
                                    <View style={styles.groupChipsContainer}>
                                        {groupNames.map((groupName, index) => (
                                            <TouchableOpacity
                                                key={index}
                                                style={[
                                                    styles.groupChip,
                                                    group === groupName && styles.selectedGroupChip
                                                ]}
                                                onPress={() => setGroup(groupName)}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={[
                                                    styles.groupChipText,
                                                    group === groupName && styles.selectedGroupChipText
                                                ]}>
                                                    {groupName}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    <Text style={[styles.label, {marginTop: 16, marginBottom: 8}]}>{t('habitConfig.orEnterNewGroupName')}</Text>
                                </View>
                            )}
                            <TextInput
                                style={styles.input}
                                value={group}
                                onChangeText={setGroup}
                                placeholder={t('habitConfig.enterHabitGroupName')}
                                placeholderTextColor="#999"
                            />
                        </View>
                    </View>
                )}

                {
                    showSaveButton && (
                        <TouchableOpacity
                            style={[styles.saveButton, {backgroundColor: COLOR_OPTIONS.find(c => c.id === selectedColor)?.color || '#4ECDC4'}]}
                            onPress={handleUpdate}
                            disabled={saving}
                            activeOpacity={0.8}
                        >
                            {saving ? (
                                <ActivityIndicator size="small" color="#fff"/>
                            ) : (
                                <Text style={styles.saveButtonText}>{t('habitConfig.saveHabit')}</Text>
                            )}
                        </TouchableOpacity>
                    )
                }

                <View style={styles.bottomSpacer}/>
            </>
        )
            ;
    }
);

const createStyles = createThemedStyles((theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.background,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: theme.text,
    },
    header: {
        padding: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        backgroundColor: theme.text,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: theme.textSecondary,
    },
    section: {
        backgroundColor: theme.surface,
        marginVertical: 10,
        marginHorizontal: 20,
        borderRadius: 12,
        padding: 20,
        shadowColor: theme.shadow,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.text,
        marginBottom: 16,
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.text,
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: theme.background,
        color: theme.text,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    halfInput: {
        flex: 0.48,
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    colorOption: {
        width: (width - 95) / 5 - 8,
        height: 50,
        borderRadius: 25,
        marginBottom: 12,
        marginHorizontal: 7.5,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: theme.shadow,
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        elevation: 3,
    },
    selectedColorOption: {
        transform: [{scale: 1.1}],
    },
    checkmark: {
        backgroundColor: theme.background,
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkmarkText: {
        color: theme.textSecondary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    frequencyButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    frequencyButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: theme.background,
        borderWidth: 1,
        borderColor: theme.border,
    },
    selectedFrequencyButton: {
        backgroundColor: '#4ECDC4',
        borderColor: '#4ECDC4',
    },
    frequencyButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.textSecondary,
    },
    selectedFrequencyButtonText: {
        color: theme.textInverse,
    },
    dynamicField: {
        borderLeftWidth: 3,
        borderLeftColor: '#4ECDC4',
        paddingLeft: 16,
        backgroundColor: '#f0fffe',
        borderRadius: 8,
        marginLeft: -8,
    },
    saveButton: {
        marginHorizontal: 16,
        marginTop: 24,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: theme.shadow,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    bottomSpacer: {
        height: 30,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    helpIcon: {
        marginLeft: 8,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: theme.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    helpIconText: {
        fontSize: 12,
        color: theme.text,
        fontWeight: 'bold',
    },
    lockIcon: {
        marginLeft: 8,
        fontSize: 14,
        color: '#e53e3e',
        lineHeight: 20,
    },
    syncInfoContainer: {
        backgroundColor: '#fed7d7',
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 8,
        padding: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#e53e3e',
    },
    syncInfoText: {
        fontSize: 14,
        color: '#742a2a',
        fontWeight: '500',
    },
    lockedInput: {
        backgroundColor: theme.background,
        color: theme.textTertiary,
        borderColor: theme.border,
    },
    lockedContainer: {
        opacity: 0.6,
    },
    lockedButton: {
        backgroundColor: theme.background,
        borderColor: theme.border,
    },
    lockedButtonText: {
        color: theme.textTertiary,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: theme.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: theme.surfaceSecondary,
        borderRadius: 12,
        padding: 20,
        maxWidth: '90%',
        shadowColor: theme.shadow,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    modalText: {
        fontSize: 16,
        color: theme.text,
        lineHeight: 24,
        marginBottom: 20,
        textAlign: 'center',
    },
    modalButton: {
        backgroundColor: '#4ECDC4',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
        alignSelf: 'center',
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    habitTypeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 8,
        overflow: 'hidden',
    },
    habitTypeButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.background,
    },
    selectedHabitTypeButton: {
        backgroundColor: '#4ECDC4',
    },
    habitTypeButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: theme.text,
    },
    selectedHabitTypeButtonText: {
        color: theme.textInverse,
    },
    frequencyDisplayButton: {
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.background,
    },
    frequencyDisplayText: {
        fontSize: 16,
        color: theme.text,
    },
    editIcon: {
        fontSize: 16,
        color: '#4ECDC4',
        marginLeft: 8,
    },
    notificationConfigButton: {
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.background,
    },
    notificationConfigText: {
        fontSize: 16,
        color: theme.text,
    },
    configIcon: {
        fontSize: 16,
        color: theme.text,
        marginLeft: 8,
    },
    labelWithClickable: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    clickableWord: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        backgroundColor: theme.primaryLight + '20', // 20% opacity
    },
    clickableText: {
        color: '#4ECDC4',
        fontWeight: '600',
    },
    weekdayContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        maxWidth: 1000,
    },
    weekdayButton: {
        width: '12%',
        maxHeight: 60,
        aspectRatio: 1,
        borderRadius: 8,
        marginBottom: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.border,
    },
    selectedWeekdayButton: {
        backgroundColor: '#4ECDC4',
        borderColor: '#4ECDC4',
    },
    weekdayButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: theme.text,
    },
    selectedWeekdayButtonText: {
        color: theme.textInverse,
    },
    dropdownContainer: {
        marginBottom: 12,
    },
    groupChipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    groupChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: theme.background,
        borderWidth: 1,
        borderColor: theme.border,
    },
    selectedGroupChip: {
        backgroundColor: '#4ECDC4',
        borderColor: '#4ECDC4',
    },
    groupChipText: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.text,
    },
    selectedGroupChipText: {
        color: theme.textInverse,
    },
}));

export default HabitConfig;

HabitConfig.displayName = 'HabitConfig';
