
import React, {useCallback, useEffect, useRef, useState} from "react";
import {Modal, StyleSheet, Text, TextInput, TouchableOpacity, View} from "react-native";
import {ApiHabitRead, habitNumberModalApi} from "../services/api";
import {MaterialCommunityIcons} from "@expo/vector-icons";
import {useTheme} from "@/context/ThemeContext";
import {useKeepAwake} from "expo-keep-awake";

interface NumberModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (value: number) => void;
    habit: ApiHabitRead;
    showStopwatch?: boolean;
    currentRecordValue?: number | null;
}

const NumberModal: React.FC<NumberModalProps> = ({
                                                     visible,
                                                     onClose,
                                                     onSubmit,
                                                     habit,
                                                     showStopwatch = true,
                                                     currentRecordValue = null
                                                 }) => {
    const {theme} = useTheme();

    const [inputValue, setInputValue] = useState<string>('');
    const [numbers, setNumbers] = useState<string[]>([]);
    const [showValueFields, setShowValueFields] = useState<boolean>(true);

    //timer
    const startTimeRef = useRef<number>(0);
    const [timerTime, setTimerTime] = useState<number>(0);
    const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
    const [delayedStartCountdown, setDelayedStartCountdown] = useState<number>(0);
    const [isDelayedStartActive, setIsDelayedStartActive] = useState<boolean>(false);
    const delayedStartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const hours = Math.floor(timerTime / 360000);
    const minutes = Math.floor((timerTime / 60000) % 60);
    const seconds = Math.floor(((timerTime / 1000) % 60));
    const milliseconds = Math.floor((timerTime / 10) % 100);

    useKeepAwake();

    const fetchNumbers = useCallback(async () => {
        try {
            const response = habit.numberModalConfig;
            const values = (response.values || []) as string[];
            setNumbers(values);
        } catch (error) {
            console.error("Failed to fetch numbers:", error);
        }
    }, [habit.uuid, currentRecordValue]);

    useEffect(() => {
        fetchNumbers();
    }, [fetchNumbers]);

    useEffect(() => {
        return () => {
            if (delayedStartTimeoutRef.current) {
                clearTimeout(delayedStartTimeoutRef.current);
            }
        };
    }, []);

    const handleSubmit = (value: string) => {
        let valueToSet: number;
        if (value.startsWith("+") || value.startsWith("-") || !currentRecordValue) {
            valueToSet = (currentRecordValue || 0) + parseFloat(value);
        } else {
            valueToSet = parseFloat(value);
        }
        if (isNaN(valueToSet)) {
            console.error("Invalid value submitted:", value);
            return;
        }
        onSubmit(valueToSet);
        setInputValue('');
        onClose();
    };

    const handleAddNumber = async () => {
        if (inputValue && !numbers.includes(inputValue)) {
            await habitNumberModalApi.addNumber(habit.uuid, inputValue);
            setNumbers([...numbers, inputValue]);
            setInputValue('');
        }
    };

    const handleRemoveNumber = async (number: string) => {
        if (number && numbers.includes(number)) {
            await habitNumberModalApi.removeNumber(habit.uuid, number);
            setNumbers(numbers.filter(num => num !== number));
        }
    };


    const onUseTimer = () => {
        setShowValueFields(false);
    }

    useEffect(() => {
        if (isTimerRunning) {
            const interval = setInterval(() => {
                setTimerTime(Math.floor((Date.now() - startTimeRef.current)));
            }, 10);
            return () => clearInterval(interval);
        }
    }, [isTimerRunning, timerTime]);

    const startAndStopTimer = () => {
        if (isTimerRunning) {
            setIsTimerRunning(false);
        } else {
            setIsTimerRunning(true);
            startTimeRef.current = Date.now() - timerTime;
        }
    };

    const startDelayedTimer = () => {
        if (isDelayedStartActive) {
            if (delayedStartTimeoutRef.current) {
                clearTimeout(delayedStartTimeoutRef.current);
                delayedStartTimeoutRef.current = null;
            }
            setIsDelayedStartActive(false);
            setDelayedStartCountdown(0);
            return;
        }

        setIsDelayedStartActive(true);
        setDelayedStartCountdown(5);

        const countdown = setInterval(() => {
            setDelayedStartCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(countdown);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        delayedStartTimeoutRef.current = setTimeout(() => {
            setIsDelayedStartActive(false);
            setDelayedStartCountdown(0);
            setIsTimerRunning(true);
            startTimeRef.current = Date.now() - timerTime;
        }, 5000);
    };

    const resetTimer = () => {
        setTimerTime(0);
    };

    const onShowValueFields = () => {
        setShowValueFields(true);
    }

    return (
        <Modal visible={visible} transparent animationType={"fade"}>
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <TouchableOpacity
                    style={[styles.modalContent, {backgroundColor: theme.surfaceTertiary}]}
                    activeOpacity={1}
                    onPress={(e) => e.stopPropagation()}
                >
                    <View style={styles.header}>
                        <View style={styles.headerTitleContainer}>
                            <TouchableOpacity onPress={onShowValueFields}>
                                <Text style={styles.headerTitleValue}>
                                    Set Value
                                </Text>
                            </TouchableOpacity>

                            {showStopwatch && (
                                <View style={styles.headerTitleRow}>
                                    <Text style={styles.headerTitleOr}> or </Text>
                                    <TouchableOpacity onPress={onUseTimer}>
                                        <Text style={styles.headerTitleStopwatch}>
                                            Start Stopwatch <MaterialCommunityIcons style={styles.timerIcon}
                                                                                    name={"timer"}/>
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                        <TouchableOpacity onPress={onClose}>
                            <MaterialCommunityIcons name="close" size={24} color="#666"/>
                        </TouchableOpacity>
                    </View>

                    {showValueFields ? (
                        <View>
                            <View style={[styles.section, {
                                backgroundColor: theme.surface,
                                borderColor: theme.border || '#e0e0e0'
                            }]}>
                                <Text style={[styles.sectionTitle, {color: theme.text}]}>
                                    Quick Values
                                </Text>
                                <View style={styles.quickValuesContainer}>
                                    {numbers.map((num) => (
                                        <TouchableOpacity
                                            key={num}
                                            style={[styles.quickValueButton, {
                                                backgroundColor: theme.primary || '#2196F3'
                                            }]}
                                            onPress={() => handleSubmit(num)}
                                            onLongPress={() => handleRemoveNumber(num)}
                                        >
                                            <Text style={styles.quickValueText}>
                                                {num}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                {numbers.length === 0 && (
                                    <Text style={[styles.emptyText, {color: theme.textSecondary || '#666'}]}>
                                        No quick values added yet
                                    </Text>
                                )}
                            </View>

                            <View style={[styles.section, {
                                backgroundColor: theme.surface,
                                borderColor: theme.border || '#e0e0e0'
                            }]}>
                                <Text style={[styles.sectionTitle, {color: theme.text}]}>
                                    Custom Value
                                </Text>
                                <View style={styles.customValueRow}>
                                    <TextInput
                                        style={[styles.textInput, {
                                            borderColor: theme.border || '#e0e0e0',
                                            color: theme.text,
                                            backgroundColor: theme.background
                                        }]}
                                        value={inputValue}
                                        onChangeText={setInputValue}
                                        placeholder="Enter value"
                                        placeholderTextColor={theme.textSecondary || '#666'}
                                    />
                                    <TouchableOpacity
                                        style={[styles.addButton, {
                                            backgroundColor: theme.secondary || '#FF9800'
                                        }]}
                                        onPress={handleAddNumber}
                                    >
                                        <MaterialCommunityIcons name="plus" size={20} color="white"/>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.timerDisplay}>
                            {isDelayedStartActive ? (
                                <View style={styles.timerContent}>
                                    <Text style={styles.delayedCountdownText}>
                                        {delayedStartCountdown}
                                    </Text>
                                    <Text style={styles.delayedCountdownLabel}>
                                        Starting in...
                                    </Text>
                                </View>
                            ) : (
                                <View style={styles.timerContent}>
                                    <Text style={styles.timerMainText}>
                                        {hours.toString().padStart(2, '0')}:
                                        {minutes.toString().padStart(2, '0')}:
                                        {seconds.toString().padStart(2, '0')}
                                    </Text>
                                    <Text style={styles.timerMilliseconds}>
                                        .{milliseconds.toString().padStart(2, '0')}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    {showValueFields ? (
                        <TouchableOpacity
                            style={[styles.submitButton, {
                                backgroundColor: theme.success || '#4CAF50'
                            }]}
                            onPress={() => handleSubmit(inputValue)}
                        >
                            <Text style={styles.submitButtonText}>
                                Submit Value
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.timerControls}>
                            <View style={styles.timerControlsLeft}>
                                <TouchableOpacity
                                    style={[styles.timerButton, {
                                        backgroundColor: isTimerRunning ? '#da0430' : '#4CAF50'
                                    }]}
                                    onPress={() => startAndStopTimer()}
                                >
                                    <Text style={styles.timerButtonText}>
                                        {isTimerRunning ? 'Stop' : 'Start'}
                                    </Text>
                                </TouchableOpacity>

                                {!isTimerRunning && (
                                    <TouchableOpacity
                                        style={[styles.timerButton, {
                                            backgroundColor: isDelayedStartActive ? '#ff6b35' : '#FF9800'
                                        }]}
                                        onPress={startDelayedTimer}
                                    >
                                        <Text style={styles.timerButtonText}>
                                            {isDelayedStartActive ? 'Cancel' : 'Delayed Start'}
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                {(!isTimerRunning && timerTime !== 0) && (
                                    <TouchableOpacity
                                        style={[styles.timerButton, styles.timerResetButton]}
                                        onPress={() => resetTimer()}
                                    >
                                        <Text style={styles.timerButtonText}>Reset</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            <View style={styles.timerControlsRight}>
                                {(!isTimerRunning && timerTime !== 0) && (
                                    <TouchableOpacity
                                        style={[styles.timerButton, styles.timerSubmitButton]}
                                        onPress={() => handleSubmit(Math.floor(timerTime / 1000).toString())}
                                    >
                                        <Text style={styles.timerSubmitButtonText}>
                                            Submit: {Math.floor(timerTime / 1000)}s
                                        </Text>
                                    </TouchableOpacity>
                                )}
                                {(!isTimerRunning && timerTime >= 60000) && (
                                    <TouchableOpacity
                                        style={[styles.timerButton, styles.timerSubmitButton]}
                                        onPress={() => handleSubmit(Math.floor(timerTime / 60000).toString())}
                                    >
                                        <Text style={styles.timerSubmitButtonText}>
                                            Submit: {Math.floor(timerTime / 60000)}m
                                        </Text>
                                    </TouchableOpacity>
                                )}
                                {(!isTimerRunning && timerTime >= 60000) && (
                                    <TouchableOpacity
                                        style={[styles.timerButton, styles.timerSubmitButton]}
                                        onPress={() => handleSubmit((Math.round((timerTime / 60000) * 100) / 100).toString())}
                                    >
                                        <Text style={styles.timerSubmitButtonText}>
                                            Submit: {Math.round((timerTime / 60000) * 100) / 100}m
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    )}

                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        borderRadius: 12,
        padding: 20,
        width: '90%',
        maxWidth: 400,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitleValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2196F3',
    },
    headerTitleOr: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerTitleStopwatch: {
        color: '#d36666',
        fontSize: 18,
        fontWeight: 'bold',
    },
    timerIcon: {
        fontSize: 18,
    },
    section: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
        textAlign: 'center',
    },
    quickValuesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
    },
    quickValueButton: {
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 18,
        minWidth: 60,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    quickValueText: {
        fontSize: 18,
        fontWeight: '700',
        color: 'white',
    },
    emptyText: {
        textAlign: 'center',
        fontStyle: 'italic',
        marginTop: 8,
    },
    customValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    textInput: {
        flex: 1,
        borderWidth: 2,
        borderRadius: 10,
        padding: 16,
        fontSize: 16,
        textAlign: 'center',
        width: '100%',
    },
    addButton: {
        borderRadius: 10,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    timerDisplay: {
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        padding: 24,
        marginBottom: 20,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 120,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    timerContent: {
        alignItems: 'center',
    },
    delayedCountdownText: {
        fontSize: 48,
        fontWeight: '700',
        color: '#ff6b35',
        fontFamily: 'monospace',
        textAlign: 'center',
    },
    delayedCountdownLabel: {
        fontSize: 16,
        color: '#888',
        marginTop: 8,
        textAlign: 'center',
    },
    timerMainText: {
        fontSize: 42,
        fontWeight: '600',
        color: '#00ff88',
        fontFamily: 'monospace',
        textAlign: 'center',
        letterSpacing: 2,
    },
    timerMilliseconds: {
        fontSize: 24,
        fontWeight: '400',
        color: '#888',
        fontFamily: 'monospace',
        marginTop: 4,
    },
    submitButton: {
        borderRadius: 12,
        padding: 18,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    submitButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
    },
    timerControls: {
        flexDirection: 'row',
        gap: 8,
    },
    timerControlsLeft: {
        flex: 1,
        gap: 8,
    },
    timerControlsRight: {
        gap: 8,
        justifyContent: 'flex-start',
    },
    timerButton: {
        borderRadius: 8,
        paddingVertical: 16,
        paddingHorizontal: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 50,
    },
    timerResetButton: {
        backgroundColor: '#ea3b4e',
    },
    timerSubmitButton: {
        backgroundColor: '#4998a7',
    },
    timerButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    timerSubmitButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default NumberModal;

