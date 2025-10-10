import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View,} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {useTheme} from "@/context/ThemeContext";
import {createThemedStyles} from "@/constants/styles";
import {FixedTimeNotificationConfigRule, NotificationConfig} from "@/services/api";
import {convertLocalTimeToUTC, convertUTCToLocalTime, formatTime, parseTime} from "@/services/timezone";

const WEEKDAYS = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

type Props = {
    hideFrequency?: boolean;
    hideWeekdays?: boolean;
    onChange?: (value: Partial<FixedTimeNotificationConfigRule>) => void;
    notificationConfigRule?: FixedTimeNotificationConfigRule;
};

const FrequencyPicker: React.FC<Props> = ({
                                              hideFrequency = false,
                                              hideWeekdays = false,
                                              onChange,
                                              notificationConfigRule,
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
        if (notificationConfigRule) {
            setFrequency(notificationConfigRule.frequency);
            const {hour: utcHour, minute: utcMinute} = parseTime(notificationConfigRule.time);
            const localTime = convertUTCToLocalTime(utcHour, utcMinute);
            setHour(localTime.hour);
            setMinute(localTime.minute);
            if (notificationConfigRule.frequency === 'weekly' && notificationConfigRule.weekdays) {
                setWeekdays(notificationConfigRule.weekdays);
            } else {
                setWeekdays([]);
            }
        }
    }, [])

    useEffect(() => {
        const utcTime = convertLocalTimeToUTC(hour, minute);
        const time = formatTime(utcTime.hour, utcTime.minute);
        onChange?.({frequency, weekdays, time});
    }, [frequency, weekdays, hour, minute, onChange]);

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
        backgroundColor: theme.surfaceSecondary,
        maxWidth: 400,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: {
        fontSize: 16,
        color: theme.text,
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
        borderColor: theme.border,
        borderRadius: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        margin: 4,
        backgroundColor: theme.surfaceTertiary,
    },
    dayButtonSelected: {
        backgroundColor: '#007bff',
        borderColor: '#007bff',
    },
    dayText: {
        fontSize: 14,
        color: theme.text,
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
        backgroundColor: theme.surfaceTertiary,
        color: theme.text,
    },
    colon: {
        fontSize: 18,
        marginHorizontal: 4,
    },
}));
