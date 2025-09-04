import {ApiHabitRead, ApiHabitRecordRead, habitRecordApi} from "@/services/api";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {getIcon} from "@/util/util";
import {useTheme} from "@/context/ThemeContext";
import {createThemedStyles} from "@/constants/styles";

const ActivityCalendar = ({handleClickOnCalendarItem, handleLongClickOnCalendarItem, habit, showTitle = true, isBooleanHabit = false}: {
    handleClickOnCalendarItem: (record: ApiHabitRecordRead) => void,
    handleLongClickOnCalendarItem: (record: ApiHabitRecordRead) => void,
    habit: ApiHabitRead,
    showTitle?: boolean,
    isBooleanHabit?: boolean
}) => {
    const {theme} = useTheme();
    const styles = createStyles(theme);

    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [calendarRecords, setCalendarRecords] = useState<ApiHabitRecordRead[]>([]);

    useEffect(() => {
        fetchCalendarData();
    }, [currentMonth, habit.uuid]);

    const fetchCalendarData = async () => {
        try {
            const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
            const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

            const startEpoch = Math.floor(Date.UTC(startOfMonth.getFullYear(), startOfMonth.getMonth(), startOfMonth.getDate()) / (1000 * 60 * 60 * 24))
            const endEpoch = Math.floor(Date.UTC(endOfMonth.getFullYear(), endOfMonth.getMonth(), endOfMonth.getDate()) / (1000 * 60 * 60 * 24))

            const calendarData = await habitRecordApi.getRecords(
                habit.uuid,
                startEpoch,
                endEpoch
            );
            setCalendarRecords(calendarData);
        } catch (error) {
            console.error('Error fetching calendar data:', error);
        }
    };


    const getCompletionColor = (completion: string) => {
        switch (completion) {
            case 'COMPLETED':
                return '#4CAF50';
            case 'PARTIALLY_COMPLETED':
                return '#FF9800';
            case 'COMPLETED_BY_OTHER_RECORDS':
                return '#addfb5';
            case 'MISSED':
                return '#F44336';
            default:
                return '#E0E0E0';
        }
    };

    const renderCalendar = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const isCurrentMonth = month === new Date().getMonth() && year === new Date().getFullYear();
        const lastDay = isCurrentMonth ?
            new Date() :
            new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay() + 1 );

        const days = [];
        const current = new Date(startDate);

        while (current <= lastDay || current.getDay() !== 1) {
            const dayEpoch = Math.floor(Date.UTC(current.getFullYear(), current.getMonth(), current.getDate()) / (1000 * 60 * 60 * 24));
            const record = calendarRecords.find(r => r.epochDay === dayEpoch);
            const isCurrentMonth = current.getMonth() === month;
            const isInFuture = current > new Date();

            days.push({
                date: new Date(current),
                epochDay: dayEpoch,
                record,
                isCurrentMonth,
                isInFuture
            });

            current.setDate(current.getDate() + 1);
        }

        const weeks = [];
        for (let i = 0; i < days.length; i += 7) {
            weeks.push(days.slice(i, i + 7));
        }


        return (
            <View style={styles.calendarContainer}>
                <View style={styles.calendarHeader}>
                    <TouchableOpacity
                        onPress={() => setCurrentMonth(new Date(year, month - 1))}
                        style={styles.monthButton}
                    >
                        <MaterialCommunityIcons name="chevron-left" size={24} color="#2196F3"/>
                    </TouchableOpacity>

                    <Text style={styles.monthTitle}>
                        {currentMonth.toLocaleDateString('en-US', {month: 'long', year: 'numeric'})}
                    </Text>

                    <TouchableOpacity
                        onPress={() => setCurrentMonth(new Date(year, month + 1))}
                        style={styles.monthButton}
                    >
                        <MaterialCommunityIcons name="chevron-right" size={24} color="#2196F3"/>
                    </TouchableOpacity>
                </View>

                <View style={styles.weekDaysHeader}>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                        <Text key={day} style={styles.weekDayText}>{day}</Text>
                    ))}
                </View>

                {weeks.map((week, weekIndex) => (
                    <View key={weekIndex} style={styles.weekRow}>
                        {week.map((day, dayIndex) => (
                            <View key={dayIndex} style={styles.dayContainer}>
                                {day.record && !day.isInFuture ? (
                                    <Pressable
                                        onPress={() => handleClickOnCalendarItem(day.record)}
                                        onLongPress={() => handleLongClickOnCalendarItem(day.record)}
                                        style={[
                                            styles.daySquare,
                                            {
                                                backgroundColor: getCompletionColor(day.record.completion),
                                                opacity: day.isCurrentMonth ? 1 : 0.3
                                            }
                                        ]}
                                    >
                                        <Text style={[
                                            styles.dayText,
                                            {
                                                color: theme.text,
                                                fontWeight: day.isCurrentMonth ? 'bold' : 'normal'
                                            }
                                        ]}>
                                            {isBooleanHabit ? getIcon(day.record.completion) : day.record.recordValue}
                                        </Text>
                                    </Pressable>
                                ) : (
                                    <View
                                        style={[
                                            styles.daySquare,
                                            {
                                                backgroundColor: theme.surfaceTertiary,
                                                opacity: day.isCurrentMonth && !day.isInFuture ? 1 : 0.3
                                            }
                                        ]}
                                    />
                                )}
                                {day.record && !day.isInFuture && (
                                    <Text style={styles.dayValue}>
                                        {day.date.getDate()}
                                    </Text>)}
                            </View>
                        ))}
                    </View>
                ))}
            </View>
        );
    };

    return (
        <View style={styles.calendarSection}>
            {showTitle && (<Text style={styles.sectionTitle}>Activity Calendar</Text>)}
            {renderCalendar()}

            <View style={styles.legendContainer}>
                <Text style={styles.legendTitle}>Legend:</Text>
                <View style={styles.legendItems}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendSquare, {backgroundColor: '#4CAF50'}]}/>
                        <Text style={styles.legendText}>Completed</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendSquare, {backgroundColor: '#addfb5'}]}/>
                        <Text style={styles.legendText}>Goal reached</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendSquare, {backgroundColor: '#FF9800'}]}/>
                        <Text style={styles.legendText}>Partial</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendSquare, {backgroundColor: '#F44336'}]}/>
                        <Text style={styles.legendText}>Missed</Text>
                    </View>
                </View>
            </View>
        </View>
    )
}

const createStyles = createThemedStyles((theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.surfaceSecondary,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.surfaceSecondary,
    },
    calendarSection: {
        backgroundColor: theme.surfaceSecondary,
        margin: 20,
        borderRadius: 16,
        padding: 20,
        shadowColor: theme.shadow,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        flex: 1
    },
    calendarContainer: {
        marginTop: 16,
    },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    monthButton: {
        padding: 8,
    },
    monthTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.text,
    },
    weekDaysHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    weekDayText: {
        fontSize: 12,
        color: theme.textSecondary,
        fontWeight: '500',
        flex: 1,
        textAlign: 'center',
    },
    weekRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    dayContainer: {
        alignItems: 'center',
        flex: 1,
    },
    daySquare: {
        width: 32,
        height: 32,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 2,
    },
    dayText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    dayValue: {
        fontSize: 8,
        color: theme.textSecondary,
    },
    legendContainer: {
        marginTop: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: theme.border,
    },
    legendTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 8,
    },
    legendItems: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    legendSquare: {
        width: 12,
        height: 12,
        borderRadius: 2,
        marginRight: 6,
    },
    legendText: {
        fontSize: 12,
        color: theme.textSecondary,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 4,
    },
    noDataText: {
        fontSize: 14,
        color: theme.text,
        textAlign: 'center',
        fontStyle: 'italic',
        marginTop: 20,
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: theme.surfaceSecondary,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: theme.background,
        borderRadius: 12,
        padding: 20,
        width: '90%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    modalMessage: {
        fontSize: 16,
        marginBottom: 24,
        textAlign: 'center',
        lineHeight: 22,
    },
    buttonContainer: {
        gap: 12,
    },
}));

export default ActivityCalendar;