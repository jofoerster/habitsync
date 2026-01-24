import {ApiHabitRead, ApiHabitRecordRead} from "@/services/api";
import {MaterialCommunityIcons} from "@expo/vector-icons";
import React, {useMemo, useState} from "react";
import {Platform, Pressable, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {getIcon} from "@/util/util";
import {useTheme} from "@/context/ThemeContext";
import {createThemedStyles} from "@/constants/styles";
import {useHabitRecords} from "@/hooks/useHabits";
import {useConfiguration} from "@/hooks/useConfiguration";

// Platform-specific imports for Victory charts - only on web
let VictoryLine: any, VictoryChart: any, VictoryAxis: any;

// if (Platform.OS === 'web') {
//     const Victory = require('victory');
//     VictoryLine = Victory.VictoryLine;
//     VictoryChart = Victory.VictoryChart;
//     VictoryAxis = Victory.VictoryAxis;
// }

const ActivityCalendar = ({
                              handleClickOnCalendarItem,
                              handleLongClickOnCalendarItem,
                              habit,
                              showTitle = true,
                              isBooleanHabit = false
                          }: {
    handleClickOnCalendarItem: (record: ApiHabitRecordRead) => void,
    handleLongClickOnCalendarItem: (record: ApiHabitRecordRead) => void,
    habit: ApiHabitRead,
    showTitle?: boolean,
    isBooleanHabit?: boolean
}) => {
    const {theme} = useTheme();
    const styles = createStyles(theme);
    const {data: config} = useConfiguration();

    const [currentMonth, setCurrentMonth] = useState(new Date());
    // Only enable graph toggle on web
    const [showCalendarAsGraph, setShowCalendarAsGraph] = useState(false);

    // Calculate epoch range for the current month
    const {startEpoch, endEpoch} = useMemo(() => {
        const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

        return {
            startEpoch: Math.floor(Date.UTC(startOfMonth.getFullYear(), startOfMonth.getMonth(), startOfMonth.getDate()) / (1000 * 60 * 60 * 24)),
            endEpoch: Math.floor(Date.UTC(endOfMonth.getFullYear(), endOfMonth.getMonth(), endOfMonth.getDate()) / (1000 * 60 * 60 * 24))
        };
    }, [currentMonth]);

    // Use React Query hooks for automatic cache updates
    const {data: calendarRecords = []} = useHabitRecords(habit.uuid, startEpoch, endEpoch);
    //const {data: percentageHistoryData} = useHabitPercentageHistory(habit.uuid, currentMonth);
    const percentageHistory = {}; //percentageHistoryData?.dailyPercentages ||

    const getCompletionColor = (completion: string) => {
        switch (completion) {
            case "COMPLETED":
                return '#4CAF50';
            case "PARTIALLY_COMPLETED":
                return '#FF9800';
            case "DISABLED_COMPLETED_BY_OTHER_RECORDS":
            case "COMPLETED_BY_OTHER_RECORDS":
                return '#addfb5';
            case "DISABLED":
                return '#515151';
            case "MISSED":
                return '#F44336';
            case "FAILED":
                return '#D32F2F';
            default:
                return '#E0E0E0';
        }
    };

    const renderGraph = () => {
        // Only render graph on web
        if (true || Platform.OS !== 'web') {
            return null;
        }

        // Convert percentage history to chart data, filtering for current month only
        const chartData = Object.entries(percentageHistory)
            .map(([epochDay, percentage]) => {
                const date = new Date(parseInt(epochDay) * 24 * 60 * 60 * 1000);
                return {
                    x: date.getDate(),
                    y: percentage,
                    epochDay: parseInt(epochDay),
                    month: date.getMonth(),
                    year: date.getFullYear()
                };
            })
            .filter(data =>
                data.month === currentMonth.getMonth() &&
                data.year === currentMonth.getFullYear()
            )
            .sort((a, b) => a.x - b.x);

        if (chartData.length === 0) {
            return (
                <View style={{height: 220, alignItems: 'center', justifyContent: 'center'}}>
                    <Text style={styles.noDataText}>No data available for this month</Text>
                </View>
            );
        }

        // Get the number of days in the current month for domain
        const daysInMonth = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth() + 1,
            0
        ).getDate();

        return (
            <View style={{height: 220, width: '100%'}}>
                <VictoryChart
                    height={200}
                    padding={{top: 20, bottom: 40, left: 50, right: 20}}
                    domain={{x: [1, daysInMonth], y: [0, 100]}}
                >
                    <VictoryAxis
                        label="Day of Month"
                        style={{
                            axisLabel: {fontSize: 12, padding: 30, fill: theme.textSecondary},
                            tickLabels: {fontSize: 10, fill: theme.textSecondary},
                            grid: {stroke: theme.border, strokeWidth: 0.5}
                        }}
                    />
                    <VictoryAxis
                        dependentAxis
                        label="Percentage (%)"
                        style={{
                            axisLabel: {fontSize: 12, padding: 35, fill: theme.textSecondary},
                            tickLabels: {fontSize: 10, fill: theme.textSecondary},
                            grid: {stroke: theme.border, strokeWidth: 0.5}
                        }}
                    />
                    <VictoryLine
                        key={`${currentMonth.getMonth()}-${currentMonth.getFullYear()}`}
                        data={chartData}
                        style={{
                            data: {stroke: "#2196F3", strokeWidth: 2}
                        }}
                        animate={{
                            duration: 300,
                            onLoad: {duration: 300}
                        }}
                    />
                </VictoryChart>
            </View>
        );
    }

    const renderCalendar = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const isCurrentMonth = month === new Date().getMonth() && year === new Date().getFullYear();
        const lastDay = isCurrentMonth ?
            new Date() :
            new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);

        const firstDayOfWeek = config?.firstDayOfWeek || 'MONDAY';
        const isSundayFirst = firstDayOfWeek === 'SUNDAY';

        const dayOfWeek = firstDay.getDay();
        // Calculate offset based on first day of week setting
        const offset = isSundayFirst
            ? dayOfWeek  // Sunday = 0, no offset needed
            : (dayOfWeek === 0 ? 6 : dayOfWeek - 1);  // Monday first: adjust so Monday = 0
        startDate.setDate(startDate.getDate() - offset);

        const days = [];
        const current = new Date(startDate);

        const targetEndDay = isSundayFirst ? 0 : 1;
        while (current <= lastDay || current.getDay() !== targetEndDay) {
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

        const weekDays = isSundayFirst
            ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
            : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        return (
            <View style={styles.calendarContainer}>
                <View style={styles.weekDaysHeader}>
                    {weekDays.map(day => (
                        <Text key={day} style={styles.weekDayText}>{day}</Text>
                    ))}
                </View>

                {weeks.map((week, weekIndex) => (
                    <View key={weekIndex} style={styles.weekRow}>
                        {week.map((day, dayIndex) => (
                            <View key={dayIndex} style={styles.dayContainer}>
                                {day.record && !day.isInFuture ? (
                                    <Pressable
                                        onPress={() => handleClickOnCalendarItem(day.record!)}
                                        onLongPress={() => handleLongClickOnCalendarItem(day.record!)}
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
                                                color: '#ffffff',
                                                fontWeight: day.isCurrentMonth ? 'bold' : 'normal'
                                            }
                                        ]}>
                                            {isBooleanHabit ? getIcon(day.record.completion as any, day.record.recordValue) : getRecordValue(day.record.recordValue)}
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

    const getRecordValue = (value: number) => {
        if (value > 99999) {
            return Math.floor(value / 1000) + 'k';
        }
        return value;
    }

    const handlePreviousMonth = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        setCurrentMonth(new Date(year, month - 1));
    };

    const handleNextMonth = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        setCurrentMonth(new Date(year, month + 1));
    };

    return (
        <View style={styles.calendarSection}>
            {showTitle && (
                <View style={styles.headerRow}>
                    <Text style={styles.sectionTitle}>Activity Calendar</Text>
                    {/* Only show toggle button on web */}
                    {Platform.OS === 'web' && false && (
                        <TouchableOpacity
                            onPress={() => setShowCalendarAsGraph(!showCalendarAsGraph)}
                            style={styles.toggleButton}
                        >
                            <MaterialCommunityIcons
                                name={showCalendarAsGraph ? "chart-line" : "calendar"}
                                size={24}
                                color="#2196F3"
                            />
                        </TouchableOpacity>
                    )}
                </View>
            )}

            <View style={styles.calendarHeader}>
                <TouchableOpacity
                    onPress={handlePreviousMonth}
                    style={styles.monthButton}
                >
                    <MaterialCommunityIcons name="chevron-left" size={24} color="#2196F3"/>
                </TouchableOpacity>

                <Text style={styles.monthTitle}>
                    {currentMonth.toLocaleDateString('en-US', {month: 'long', year: 'numeric'})}
                </Text>

                <TouchableOpacity
                    onPress={handleNextMonth}
                    style={styles.monthButton}
                >
                    <MaterialCommunityIcons name="chevron-right" size={24} color="#2196F3"/>
                </TouchableOpacity>
            </View>

            {/* Only show graph on web, always show calendar on native */}
            {Platform.OS === 'web' && showCalendarAsGraph ? renderGraph() : renderCalendar()}

            {!showCalendarAsGraph && (
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
            )}
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
        backgroundColor: theme.surface,
        marginHorizontal: 20,
        marginVertical: 10,
        borderRadius: 16,
        paddingVertical: 20,
        paddingHorizontal: 20,
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
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    toggleButton: {
        padding: 8,
    },
}));

export default ActivityCalendar;
