import {Plus, X} from "lucide-react-native";
import React, {useCallback, useEffect, useRef, useState} from "react";
import {Modal, Text, TextInput, TouchableOpacity, View} from "react-native";
import {habitNumberModalApi} from "../services/api";
import {MaterialCommunityIcons} from "@expo/vector-icons";
import {useTheme} from "@/context/ThemeContext";
import {useKeepAwake} from "expo-keep-awake";

interface NumberModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (value: number) => void;
    habit: {
        uuid: string;
    };
    showStopwatch?: boolean;
    currentRecordValue?: number | null;
}

const NumberModal: React.FC<NumberModalProps> = ({visible, onClose, onSubmit, habit, showStopwatch = true, currentRecordValue = null}) => {
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
            const response = await habitNumberModalApi.getNumberModal(habit.uuid);
            const values = (response.values || []) as string[];
            if (!currentRecordValue) {
                setNumbers(values.filter((num) => !(num.startsWith("-") || num.startsWith("+"))));
            } else {
                setNumbers(values);
            }
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
            valueToSet = (currentRecordValue || 0) + parseInt(value);
        } else {
            valueToSet = parseInt(value);
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
                style={{
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}
                activeOpacity={1}
                onPress={onClose}
            >
                <TouchableOpacity
                    style={{
                        backgroundColor: theme.surfaceTertiary,
                        borderRadius: 12,
                        padding: 20,
                        width: '90%',
                        maxWidth: 400
                    }}
                    activeOpacity={1}
                    onPress={(e) => e.stopPropagation()}
                >
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 20
                    }}>
                        <View style={{flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap'}}>
                            <TouchableOpacity onPress={onShowValueFields}>
                                <Text style={{fontSize: 18, fontWeight: 'bold', color: '#2196F3'}}>
                                    Set Value
                                </Text>
                            </TouchableOpacity>

                            {showStopwatch && (
                                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                    <Text style={{fontSize: 18, fontWeight: 'bold'}}> or </Text>
                                    <TouchableOpacity onPress={onUseTimer}>
                                        <Text style={{color: '#d36666', fontSize: 18, fontWeight: 'bold'}}>
                                            Start Stopwatch <MaterialCommunityIcons style={{fontSize: 18}} name={"timer"}/>
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                        <TouchableOpacity onPress={onClose}>
                            <X size={24} color="#666"/>
                        </TouchableOpacity>
                    </View>

                    {showValueFields ? (
                        <View>
                            <View style={{
                                backgroundColor: theme.surface,
                                borderRadius: 12,
                                padding: 16,
                                marginBottom: 20,
                                borderWidth: 1,
                                borderColor: theme.border || '#e0e0e0'
                            }}>
                                <Text style={{
                                    fontSize: 16,
                                    fontWeight: '600',
                                    color: theme.text,
                                    marginBottom: 12,
                                    textAlign: 'center'
                                }}>
                                    Quick Values
                                </Text>
                                <View style={{
                                    flexDirection: 'row',
                                    flexWrap: 'wrap',
                                    justifyContent: 'center',
                                    gap: 8
                                }}>
                                    {numbers.map((num) => (
                                        <TouchableOpacity
                                            key={num}
                                            style={{
                                                backgroundColor: theme.primary || '#2196F3',
                                                borderRadius: 12,
                                                paddingVertical: 14,
                                                paddingHorizontal: 18,
                                                minWidth: 60,
                                                alignItems: 'center',
                                                shadowColor: '#000',
                                                shadowOffset: {width: 0, height: 2},
                                                shadowOpacity: 0.1,
                                                shadowRadius: 4,
                                                elevation: 3
                                            }}
                                            onPress={() => handleSubmit(num)}
                                            onLongPress={() => handleRemoveNumber(num)}
                                        >
                                            <Text style={{
                                                fontSize: 18,
                                                fontWeight: '700',
                                                color: 'white'
                                            }}>
                                                {num}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                {numbers.length === 0 && (
                                    <Text style={{
                                        textAlign: 'center',
                                        color: theme.textSecondary || '#666',
                                        fontStyle: 'italic',
                                        marginTop: 8
                                    }}>
                                        No quick values added yet
                                    </Text>
                                )}
                            </View>

                            <View style={{
                                backgroundColor: theme.surface,
                                borderRadius: 12,
                                padding: 16,
                                marginBottom: 20,
                                borderWidth: 1,
                                borderColor: theme.border || '#e0e0e0'
                            }}>
                                <Text style={{
                                    fontSize: 16,
                                    fontWeight: '600',
                                    color: theme.text,
                                    marginBottom: 12,
                                    textAlign: 'center'
                                }}>
                                    Custom Value
                                </Text>
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 12
                                }}>
                                    <TextInput
                                        style={{
                                            flex: 1,
                                            borderWidth: 2,
                                            borderColor: theme.border || '#e0e0e0',
                                            borderRadius: 10,
                                            padding: 16,
                                            fontSize: 16,
                                            color: theme.text,
                                            backgroundColor: theme.background,
                                            textAlign: 'center'
                                        }}
                                        value={inputValue}
                                        onChangeText={setInputValue}
                                        placeholder="Enter value"
                                        placeholderTextColor={theme.textSecondary || '#666'}
                                        keyboardType="numeric"
                                    />
                                    <TouchableOpacity
                                        style={{
                                            backgroundColor: theme.secondary || '#FF9800',
                                            borderRadius: 10,
                                            padding: 16,
                                            shadowColor: '#000',
                                            shadowOffset: {width: 0, height: 2},
                                            shadowOpacity: 0.1,
                                            shadowRadius: 4,
                                            elevation: 3
                                        }}
                                        onPress={handleAddNumber}
                                    >
                                        <Plus size={20} color="white"/>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <View style={{
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
                            elevation: 5
                        }}>
                            {isDelayedStartActive ? (
                                <View style={{ alignItems: 'center' }}>
                                    <Text style={{
                                        fontSize: 48,
                                        fontWeight: '700',
                                        color: '#ff6b35',
                                        fontFamily: 'monospace',
                                        textAlign: 'center'
                                    }}>
                                        {delayedStartCountdown}
                                    </Text>
                                    <Text style={{
                                        fontSize: 16,
                                        color: '#888',
                                        marginTop: 8,
                                        textAlign: 'center'
                                    }}>
                                        Starting in...
                                    </Text>
                                </View>
                            ) : (
                                <View style={{ alignItems: 'center' }}>
                                    <Text style={{
                                        fontSize: 42,
                                        fontWeight: '600',
                                        color: '#00ff88',
                                        fontFamily: 'monospace',
                                        textAlign: 'center',
                                        letterSpacing: 2
                                    }}>
                                        {hours.toString().padStart(2, '0')}:
                                        {minutes.toString().padStart(2, '0')}:
                                        {seconds.toString().padStart(2, '0')}
                                    </Text>
                                    <Text style={{
                                        fontSize: 24,
                                        fontWeight: '400',
                                        color: '#888',
                                        fontFamily: 'monospace',
                                        marginTop: 4
                                    }}>
                                        .{milliseconds.toString().padStart(2, '0')}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    {showValueFields ? (
                        <TouchableOpacity
                            style={{
                                backgroundColor: theme.success || '#4CAF50',
                                borderRadius: 12,
                                padding: 18,
                                alignItems: 'center',
                                shadowColor: '#000',
                                shadowOffset: {width: 0, height: 2},
                                shadowOpacity: 0.15,
                                shadowRadius: 4,
                                elevation: 4
                            }}
                            onPress={() => handleSubmit(inputValue)}
                        >
                            <Text style={{
                                color: 'white',
                                fontSize: 18,
                                fontWeight: '700'
                            }}>
                                Submit Value
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={{flexDirection: 'row'}}>
                            <View style={{flex: 1, flexDirection: "column"}}>
                                <TouchableOpacity
                                    style={{
                                        backgroundColor: isTimerRunning ? '#da0430' : '#4CAF50',
                                        borderRadius: 8,
                                        padding: (isTimerRunning || timerTime === 0) ? 16 : 2,
                                        alignItems: 'center',
                                        flex: 1,
                                        margin: 4
                                    }}
                                    onPress={() => startAndStopTimer()}
                                >
                                    {isTimerRunning ? (
                                        <Text style={{color: 'white', fontSize: 16, fontWeight: 'bold'}}>Stop</Text>
                                    ) : (
                                        <Text style={{color: 'white', fontSize: 16, fontWeight: 'bold'}}>Start</Text>
                                    )}
                                </TouchableOpacity>

                                {!isTimerRunning && (
                                    <TouchableOpacity
                                        style={{
                                            backgroundColor: isDelayedStartActive ? '#ff6b35' : '#FF9800',
                                            borderRadius: 8,
                                            padding: isDelayedStartActive ? 16 : 2,
                                            alignItems: 'center',
                                            flex: 1,
                                            margin: 4
                                        }}
                                        onPress={startDelayedTimer}
                                    >
                                        <Text style={{color: 'white', fontSize: 16, fontWeight: 'bold'}}>
                                            {isDelayedStartActive ? 'Cancel' : 'Delayed Start'}
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                {(!isTimerRunning && timerTime !== 0) && (
                                    <TouchableOpacity
                                        style={{
                                            backgroundColor: '#ea3b4e',
                                            borderRadius: 8,
                                            padding: 2,
                                            alignItems: 'center',
                                            flex: 1,
                                            margin: 4
                                        }}
                                        onPress={() => resetTimer()}
                                    >

                                        <Text style={{color: 'white', fontSize: 16, fontWeight: 'bold'}}>Reset</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            {(!isTimerRunning && timerTime !== 0) && (
                                <TouchableOpacity
                                    style={{
                                        backgroundColor: '#4998a7',
                                        borderRadius: 8,
                                        padding: 16,
                                        alignItems: 'center',
                                        flex: 1,
                                        margin: 4
                                    }}
                                    onPress={() => handleSubmit(Math.floor(timerTime / 1000).toString())}
                                >
                                    <Text style={{
                                        color: 'white',
                                        fontSize: 16,
                                        fontWeight: 'bold'
                                    }}>Submit: {Math.floor(timerTime / 1000)}</Text>
                                </TouchableOpacity>
                            )}
                            {(!isTimerRunning && timerTime >= 60000) && (
                                <TouchableOpacity
                                    style={{
                                        backgroundColor: '#4998a7',
                                        borderRadius: 8,
                                        padding: 16,
                                        alignItems: 'center',
                                        flex: 1,
                                        margin: 4
                                    }}
                                    onPress={() => handleSubmit(Math.floor(timerTime / 60000).toString())}
                                >
                                    <Text style={{
                                        color: 'white',
                                        fontSize: 16,
                                        fontWeight: 'bold'
                                    }}>Submit: {Math.floor(timerTime / 60000)}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};

export default NumberModal;
