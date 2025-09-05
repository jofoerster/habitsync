import React, {useCallback, useEffect, useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View,} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {useTheme} from "@/context/ThemeContext";
import {createThemedStyles} from "@/constants/styles";
import {NotificationFrequency} from "@/services/api";

const WEEKDAYS = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

type Props = {
    hideFrequency?: boolean;
    hideWeekdays?: boolean;
    onChange?: (value: NotificationFrequency) => void;
    notificationFrequency?: NotificationFrequency;
};

const FrequencyPicker: React.FC<Props> = ({
                                              hideFrequency = false,
                                              hideWeekdays = false,
                                              onChange,
                                              notificationFrequency,
                                          }) => {
    const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
    const [weekdays, setWeekdays] = useState<string[]>([]);
    const [hour, setHour] = useState<number>(8);
    const [minute, setMinute] = useState<number>(0);

    const {theme} = useTheme();
    const styles = createStyles(theme);

    const toggleWeekday = (day: string) => {
        setWeekdays((prev) =>
            prev.includes(day)
                ? prev.filter((d) => d !== day)
                : [...prev, day]
        );
    };

    useEffect(() => {
        if (notificationFrequency) {
            setFrequency(notificationFrequency.frequency);
            setHour(Number(notificationFrequency.time.split(':')[0]));
            setMinute(Number(notificationFrequency.time.split(':')[1]));
            if (notificationFrequency.frequency === 'weekly' && notificationFrequency.weekdays) {
                setWeekdays(notificationFrequency.weekdays);
            } else {
                setWeekdays([]);
            }
        }
    }, [notificationFrequency])

    useEffect(() => {
        const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        onChange?.({frequency, weekdays, time});
    }, [frequency, weekdays, hour, minute]);

    return (
        <View style={styles.container}>
            {!hideFrequency && (
                <View style={styles.row}>
                    <Text style={styles.label}>Daily</Text>
                    <TouchableOpacity
                        onPress={() => setFrequency(frequency === 'daily' ? 'weekly' : 'daily')}
                    >
                        <Text style={styles.toggleText}>
                            {frequency === 'daily' ? '→ Weekly' : '→ Daily'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {frequency === 'weekly' && !hideWeekdays && (
                <View style={styles.weekdayContainer}>
                    {WEEKDAYS.map((day) => (
                        <TouchableOpacity
                            key={day}
                            style={[
                                styles.dayButton,
                                weekdays.includes(day) && styles.dayButtonSelected,
                            ]}
                            onPress={() => toggleWeekday(day)}
                        >
                            <Text
                                style={[
                                    styles.dayText,
                                    weekdays.includes(day) && styles.dayTextSelected,
                                ]}
                            >
                                {day}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            <View style={styles.timeContainer}>
                <Text style={styles.label}>Time:</Text>
                <View style={styles.pickersRow}>
                    <Picker
                        selectedValue={hour}
                        onValueChange={(val) => setHour(Number(val))}
                        style={styles.picker}
                    >
                        {Array.from({length: 24}, (_, i) => (
                            <Picker.Item key={i} label={`${i}`} value={i}/>
                        ))}
                    </Picker>
                    <Text style={styles.colon}>:</Text>
                    <Picker
                        selectedValue={minute}
                        onValueChange={(val) => setMinute(Number(val))}
                        style={styles.picker}
                    >
                        {Array.from({length: 60}, (_, i) => (
                            <Picker.Item
                                key={i}
                                label={String(i).padStart(2, '0')}
                                value={i}
                            />
                        ))}
                    </Picker>
                </View>
            </View>
        </View>
    );
};

export default FrequencyPicker;

const createStyles = createThemedStyles((theme) => StyleSheet.create({
    container: {
        padding: 16,
        borderRadius: 8,
        backgroundColor: '#f2f2f2',
        maxWidth: 400,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: {
        fontSize: 16,
    },
    toggleText: {
        fontSize: 16,
        color: '#007bff',
    },
    weekdayContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 12,
    },
    dayButton: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        margin: 4,
        backgroundColor: '#fff',
    },
    dayButtonSelected: {
        backgroundColor: '#007bff',
        borderColor: '#007bff',
    },
    dayText: {
        fontSize: 14,
        color: '#333',
    },
    dayTextSelected: {
        color: '#fff',
    },
    timeContainer: {
        marginTop: 16,
    },
    pickersRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    picker: {
        width: 100,
        height: 40,
    },
    colon: {
        fontSize: 18,
        marginHorizontal: 4,
    },
}));
