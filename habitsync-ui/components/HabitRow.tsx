import {ChevronDown, ChevronUp} from "lucide-react-native";
import React, {useEffect, useState} from "react";
import {Pressable, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {ApiHabitRead, ApiHabitRecordRead, habitApi, habitRecordApi} from "../services/api";
import NumberModal from "./NumberModal";
import ProgressRing from "./ProgressRing";
import {Link} from 'expo-router';
import {MaterialCommunityIcons} from "@expo/vector-icons";
import {getIcon} from "@/util/util";
import alert from "@/services/alert";
import {useTheme} from "@/context/ThemeContext";


interface DayButtonProps {
    day: string,
    completion: 'COMPLETED' | 'PARTIALLY_COMPLETED' | 'COMPLETED_BY_OTHER_RECORDS' | 'MISSED' | 'LOADING',
    value: number,
    onPress: () => void,
    onLongPress: () => void,
    disabled?: boolean,
    hideDates?: boolean,
    showCheckMarkIcon?: boolean
}

const DayButton: React.FC<DayButtonProps> = ({
                                                 day,
                                                 completion,
                                                 value,
                                                 onPress,
                                                 onLongPress,
                                                 disabled,
                                                 hideDates,
                                                 showCheckMarkIcon
                                             }) => {
    const {theme, isDark} = useTheme();

    const getButtonStyle = () => {
        switch (completion) {
            case 'COMPLETED':
                return {
                    backgroundColor: '#4CAF50',
                    borderColor: '#4CAF50',
                    shadowColor: '#9E9E9E',
                    shadowOffset: {width: 0, height: 0},
                    shadowOpacity: 0.7,
                    shadowRadius: 8,
                    elevation: 5
                };
            case 'PARTIALLY_COMPLETED':
                return {
                    backgroundColor: '#f6ddb1',
                    borderColor: '#f6ddb1',
                    shadowColor: '#f6ddb1',
                    shadowOffset: {width: 0, height: 0},
                    shadowOpacity: 0.7,
                    shadowRadius: 8,
                    elevation: 5
                };
            case 'COMPLETED_BY_OTHER_RECORDS':
                return {
                    backgroundColor: '#a4cca6', borderColor: '#a4cca6', shadowColor: '#a4cca6',
                    shadowOffset: {width: 0, height: 0},
                    shadowOpacity: 0.7,
                    shadowRadius: 8,
                    elevation: 5
                };
            default:
                return {
                    backgroundColor: isDark ? '#4a4a4a' : '#e0e0e0',
                    borderColor: isDark ? '#4a4a4a' : '#e0e0e0',
                    shadowColor: isDark ? '#4a4a4a' : '#e0e0e0',
                    shadowOffset: {width: 0, height: 0},
                    shadowOpacity: 0.7,
                    shadowRadius: 8,
                    elevation: 5
                };
        }
    };

    return (
        <TouchableOpacity
            style={[{
                width: 36,
                height: 36,
                borderRadius: 18,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 2,
                marginHorizontal: 4
            }, getButtonStyle()]}
            onPress={disabled ? undefined : onPress}
            onLongPress={disabled ? undefined : onLongPress}
        >
            {value == 0 || (value == 1 && showCheckMarkIcon) ? (
                <Text style={{color: 'white', fontSize: 18, fontWeight: 'bold'}}>
                    {getIcon(completion)}
                </Text>) : (
                <Text style={{color: 'white', fontSize: 18, fontWeight: 'bold'}}>
                    {value}
                </Text>
            )}
        </TouchableOpacity>
    );
};

interface HabitRowProps {
    habit: ApiHabitRead,
    isExpanded: boolean,
    onToggleExpand: () => void,
    connectedHabits?: ApiHabitRead[],
    isConnectedHabitView?: boolean,
    isChallengeHabit?: boolean,
    onUpdate?: (habit: ApiHabitRead) => void,
    isDragModeEnabled?: boolean,
    hideDates?: boolean,
    hideProgressRing?: boolean,
    habitIndex?: number,
    totalHabits?: number,
    onMoveUp?: (habitUuid: string) => void,
    onMoveDown?: (habitUuid: string) => void
}

const HabitRow: React.FC<HabitRowProps> = ({
                                               habit,
                                               isExpanded,
                                               onToggleExpand,
                                               connectedHabits,
                                               isConnectedHabitView,
                                               isChallengeHabit,
                                               onUpdate,
                                               isDragModeEnabled = false,
                                               hideDates = false,
                                               hideProgressRing = false,
                                               habitIndex = 0,
                                               totalHabits = 1,
                                               onMoveUp,
                                               onMoveDown
                                           }) => {
    const {theme} = useTheme();

    const [modalVisible, setModalVisible] = useState(false);
    const [modalConfig, setModalConfig] = useState({
        epochDay: null,
        habitUuid: null,
    });
    const [records, setRecords] = useState<Map<number, ApiHabitRecordRead>>(new Map())
    const [loading, setLoading] = useState(true);
    const [hasConnectedHabits, setHasConnectedHabits] = useState(!isConnectedHabitView && !isChallengeHabit);
    const [percentage, setPercentage] = useState(habit.currentPercentage);
    const [habitColor, setHabitColor] = useState(habit.color);

    useEffect(() => {
        loadHabitRecords();
    }, []);

    useEffect(() => {
        checkIfHasConnectedHabits();
    }, []);

    const formatDate = (date: Date): string =>
        date.toLocaleDateString('de-DE', {day: '2-digit', month: '2-digit'}).replace('/', '.');

    const getEpochDay = (date: Date): number =>
        Math.floor(date.getTime() / 86400000);

    const createDay = (daysAgo: number, key: string): DayItem => {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        return {
            key,
            label: formatDate(date),
            epochDay: getEpochDay(date)
        };
    };

    const days = [
        createDay(0, 'today'),
        createDay(1, 'yesterday'),
        createDay(2, 'dayBeforeYesterday')
    ];

    const loadHabitRecords = async (habitNew: ApiHabitRead | null = null) => {
        try {
            console.log("Records:" + habit.records);
            const habitToUse = habitNew || habit;
            setRecords(new Map(habitToUse.records.map(r => [r.epochDay, r])));
        } catch (error) {
            alert('Error', 'Failed to load habit records');
        } finally {
            setLoading(false);
        }
    };

    const checkIfHasConnectedHabits = async () => {
        if (isConnectedHabitView || isChallengeHabit) {
            setHasConnectedHabits(false);
            return;
        }
        setHasConnectedHabits(habit.hasConnectedHabits);
    }

    const getRecordForDay = (epochDay) => {
        if (loading) {
            return {completion: 'LOADING', recordValue: "?"};
        }
        return records.get(epochDay) || {completion: 'MISSED', recordValue: 0};
    };

    const handleDayPress = async (epochDay) => {
        try {
            if (isChallengeHabit) {
                return handleDayLongPress(epochDay);
            }
            const oldRecord = getRecordForDay(epochDay);
            const newRecordValue = oldRecord.recordValue == 0 ? habit.progressComputation.dailyGoal : 0
            const newRecord = await habitRecordApi.createRecord(habit.uuid, {
                epochDay: epochDay,
                recordValue: newRecordValue
            })
            const updatedHabit = await handleHabitUpdate(habit);
            await loadHabitRecords(updatedHabit);
        } catch (error) {
            alert('Error', 'Failed to update record');
        }
    };

    const handleDayLongPress = async (epochDay) => {
        try {
            const config = {habitUuid: habit.uuid, epochDay: epochDay};
            setModalConfig(config);
            setModalVisible(true);
        } catch (error) {
            alert('Error', 'Failed to load modal configuration');
        }
    };

    const handleModalSubmit = async (value: string) => {
        try {
            const epochDay = modalConfig.epochDay;

            const newRecord = await habitRecordApi.createRecord(habit.uuid, {
                epochDay: epochDay,
                recordValue: parseFloat(value) || 0
            });
            const updatedHabit = await handleHabitUpdate(habit);
            await loadHabitRecords(updatedHabit);
        } catch (error) {
            alert('Error', 'Failed to update record');
        }
    };

    const handleHabitUpdate = async (habit: ApiHabitRead) => {
        try {
            const updatedHabit = await habitApi.getHabitByUuid(habit.uuid);
            setPercentage(updatedHabit.currentPercentage);
            setHabitColor(updatedHabit.color);
            if (onUpdate) {
                onUpdate(updatedHabit);
            }
            return updatedHabit;
        } catch (error) {
            alert('Error', 'Failed to update habit');
        }
    }

    return (
        <View style={{marginBottom: 16}}>
            <View style={{
                backgroundColor: theme.surface,
                borderRadius: 10,
                padding: 4,
                shadowColor: '#000',
                shadowOffset: {width: 0, height: 1},
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 1,
            }}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Link
                        href={{
                            pathname: '/habit/[habitUuid]',
                            params: {habitUuid: habit.uuid, isOwnHabit: (!isConnectedHabitView).toString()}
                        }}
                        asChild
                    >
                        <Pressable style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
                            <View style={{paddingRight: 10}}>
                                {!hideProgressRing && (
                                    <ProgressRing color={habitColor} percentage={percentage}/>)}
                            </View>
                            <View style={{flex: 1}}>
                                <Text style={{fontSize: 16, fontWeight: 'bold', color: theme.text}}>
                                    {!habit.currentMedal !== undefined ? habit.currentMedal : ''}
                                    {!isConnectedHabitView ? (habit.name) : (habit.account.displayName)}
                                </Text>
                                {isConnectedHabitView === true && (
                                    <Text style={{fontSize: 8, color: theme.text}}>
                                        {habit.name}
                                    </Text>
                                )}
                            </View>
                        </Pressable>
                    </Link>

                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        {(!isConnectedHabitView && hasConnectedHabits && !isDragModeEnabled) && (
                            <TouchableOpacity
                                style={{
                                    backgroundColor: theme.surfaceSecondary,
                                    borderRadius: 8,
                                    padding: 3,
                                    marginRight: 8,
                                }}
                                onPress={onToggleExpand}
                            >
                                {isExpanded ? <ChevronUp color={theme.text} size={20}/> :
                                    <ChevronDown color={theme.text} size={20}/>}
                            </TouchableOpacity>
                        )}

                        <View style={{flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'flex-end'}}>
                            {isDragModeEnabled && !isConnectedHabitView ? (
                                // Show reorder arrows instead of day buttons when in drag mode
                                <View style={styles.reorderContainer}>
                                    <TouchableOpacity
                                        style={[
                                            styles.reorderButton,
                                            habitIndex === 0 && styles.reorderButtonDisabled
                                        ]}
                                        disabled={habitIndex === 0}
                                        onPress={() => onMoveUp && onMoveUp(habit.uuid)}
                                    >
                                        <MaterialCommunityIcons
                                            name="arrow-up"
                                            size={18}
                                            color="white"
                                        />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.reorderButton,
                                            habitIndex >= totalHabits - 1 && styles.reorderButtonDisabled
                                        ]}
                                        disabled={habitIndex >= totalHabits - 1}
                                        onPress={() => onMoveDown && onMoveDown(habit.uuid)}
                                    >
                                        <MaterialCommunityIcons
                                            name="arrow-down"
                                            size={18}
                                            color="white"
                                        />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                days.map(day => {
                                    const record = getRecordForDay(day.epochDay);
                                    return (
                                        <View key={day.key + habit.uuid}>
                                            {!hideDates && (<Text key={day.key + record.id}
                                                                  style={{
                                                                      fontSize: 10,
                                                                      color: theme.textSecondary,
                                                                      textAlign: 'center'
                                                                  }}>
                                                {day.label}
                                            </Text>)}
                                            <DayButton
                                                key={day.key + habit.uuid}
                                                day={day.label}
                                                completion={record.completion}
                                                value={record.recordValue}
                                                onPress={() => handleDayPress(day.epochDay)}
                                                onLongPress={() => handleDayLongPress(day.epochDay)}
                                                disabled={isConnectedHabitView}
                                                hideDates={hideDates}
                                                showCheckMarkIcon={habit.progressComputation.dailyReachableValue === 1}
                                            />
                                        </View>
                                    );
                                })
                            )}
                        </View>
                    </View>
                </View>
            </View>

            {isExpanded && connectedHabits && connectedHabits.length > 0 && (
                <View style={{marginTop: 8, marginLeft: 16}}>
                    <Text style={{fontSize: 14, fontWeight: 'bold', color: '#666', marginBottom: 8}}>
                        Connected Habits
                    </Text>
                    {connectedHabits.filter(habit => habit.currentPercentage > 0.01).map(connectedHabit => (
                        <HabitRow
                            key={connectedHabit.uuid}
                            habit={connectedHabit}
                            isExpanded={false}
                            onToggleExpand={() => {
                            }}
                            connectedHabits={[]}
                            hideDates={true}
                            isConnectedHabitView={true}
                        />
                    ))}
                </View>
            )}

            <NumberModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSubmit={handleModalSubmit}
                habit={habit}
                currentRecordValue={getRecordForDay(modalConfig.epochDay).recordValue}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    reorderContainer: {
        flexDirection: 'row',
        gap: 8,
        marginHorizontal: 8
    },
    reorderButton: {
        backgroundColor: '#667eea',
        borderRadius: 8,
        padding: 8,
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
        minWidth: 36,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2
    },
    reorderButtonDisabled: {
        backgroundColor: '#e0e0e0',
        opacity: 0.5
    }
});

export default HabitRow;
