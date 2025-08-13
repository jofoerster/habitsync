import {Plus, X} from "lucide-react-native";
import React, {useEffect, useRef, useState} from "react";
import {Modal, Text, TextInput, TouchableOpacity, View} from "react-native";
import {habitNumberModalApi} from "../services/api";
import {MaterialCommunityIcons} from "@expo/vector-icons";
import {useTheme} from "@/context/ThemeContext";

const NumberModal = ({visible, onClose, onSubmit, habit, showStopwatch = true, currentRecordValue = null}) => {
    const {theme} = useTheme();

    const [inputValue, setInputValue] = useState('');
    const [numbers, setNumbers] = useState([]);
    const [showValueFields, setShowValueFields] = useState(true);

    //timer
    const startTimeRef = useRef(0);
    const [timerTime, setTimerTime] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const hours = Math.floor(timerTime / 360000);
    const minutes = Math.floor((timerTime / 60000) % 60);
    const seconds = Math.floor(((timerTime / 1000) % 60));
    const milliseconds = Math.floor((timerTime / 10) % 100);

    useEffect(() => {
        fetchNumbers();
    }, [])

    const handleSubmit = (value: string) => {
        let valueToSet;
        if (value.startsWith("+") || value.startsWith("-") || !currentRecordValue) {
            valueToSet = currentRecordValue! + parseInt(value);
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

    const handleRemoveNumber = async (number) => {
        if (number && numbers.includes(number)) {
            await habitNumberModalApi.removeNumber(habit.uuid, number);
            setNumbers(numbers.filter(num => num !== number));
        }
    };

    const fetchNumbers = async () => {
        try {
            const response = await habitNumberModalApi.getNumberModal(habit.uuid);
            if (!currentRecordValue) {
                setNumbers(response.values.filter(num => !(num.startsWith("-") || num.startsWith("+"))) || []);
            } else {
                setNumbers(response.values || []);
            }
        } catch (error) {
            console.error("Failed to fetch numbers:", error);
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
                                    <Text style={{fontSize: 18, fontWeight: 'bold', marginLeft: 10}}> or </Text>
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
                        <View style={{
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            marginBottom: 20
                        }}>
                            {numbers.map((num) => (
                                <TouchableOpacity
                                    key={num}
                                    style={{
                                        backgroundColor: theme.background,
                                        borderRadius: 8,
                                        padding: 12,
                                        margin: 4,
                                        minWidth: 50,
                                        alignItems: 'center'
                                    }}
                                    onPress={() => handleSubmit(num)}
                                    onLongPress={() => handleRemoveNumber(num)}

                                >
                                    <Text style={{fontSize: 16, fontWeight: 'bold', color: theme.text}}>{num}</Text>
                                </TouchableOpacity>
                            ))}
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
                    {showValueFields && (
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: 20
                        }}>
                            <TextInput
                                style={{
                                    flex: 1,
                                    borderWidth: 1,
                                    borderColor: '#ccc',
                                    borderRadius: 8,
                                    padding: 12,
                                    marginRight: 8,
                                    color: theme.text,
                                }}
                                value={inputValue}
                                onChangeText={setInputValue}
                                placeholder="Enter custom value"
                                keyboardType="numeric"
                            />
                            <TouchableOpacity
                                style={{
                                    backgroundColor: '#2196F3',
                                    borderRadius: 8,
                                    padding: 12
                                }}
                                onPress={handleAddNumber}
                            >
                                <Plus size={20} color="white"/>
                            </TouchableOpacity>
                        </View>
                    )}
                    {showValueFields ? (
                        <TouchableOpacity
                            style={{
                                backgroundColor: '#4CAF50',
                                borderRadius: 8,
                                padding: 16,
                                alignItems: 'center'
                            }}
                            onPress={() => handleSubmit(inputValue)}
                        >
                            <Text style={{color: 'white', fontSize: 16, fontWeight: 'bold'}}>Submit</Text>
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
