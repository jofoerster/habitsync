import React, {useState} from "react";
import {StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {getColorById} from "@/constants/colors";
import ProgressBar from "@/components/ProgressBar";
import {ApiAccountRead, ApiHabitRead, ApiSharedHabitMedalsRead, ApiSharedHabitRead} from "@/services/api";
import {MaterialCommunityIcons} from "@expo/vector-icons";
import ActivityCalendar from "@/components/ActivityCalendar";
import {useTheme} from "@/context/ThemeContext";
import {createThemedStyles} from "@/constants/styles";

const SharedHabitParticipants = ({sharedHabit, currentUser, hideHabit, medals}: {
    sharedHabit: ApiSharedHabitRead,
    currentUser?: ApiAccountRead
    hideHabit?: ApiHabitRead
    medals?: ApiSharedHabitMedalsRead[]
}) => {
    const {theme} = useTheme();
    const styles = createStyles(theme);

    const [isExpandedList, setIsExpandedList] = useState<Map<string, boolean>>(new Map());

    const onToggleExpand = (uuid: string) => {
        setIsExpandedList(isExpandedList.get(uuid) ? new Map(isExpandedList).set(uuid, false) : new Map(isExpandedList).set(uuid, true));
    }

    const getUserMedals = (authenticationId: string) => {
        return medals?.find(m => m.account.authenticationId === authenticationId)?.medals || [];
    }

    return (
        <View>
            {sharedHabit.habits.filter(h => !hideHabit || h.uuid !== hideHabit.uuid).map(habit => (
                <View key={habit.uuid} style={styles.participantCard}>
                    <View style={{flex: 1, flexDirection: 'column'}}>
                        <View style={{flex: 1, flexDirection: 'row', alignItems: 'center'}}>
                            <TouchableOpacity onPress={() => onToggleExpand(habit.uuid)}>
                                {isExpandedList.get(habit.uuid) ?
                                    <MaterialCommunityIcons name="chevron-up" color={theme.text} size={20} style={{marginRight: 5}}/> :
                                    <MaterialCommunityIcons name="chevron-down" color={theme.text} size={20} style={{marginRight: 5}}/>}
                            </TouchableOpacity>
                            <View style={styles.participantInfo}>
                                <View
                                    style={[styles.participantColorDot, {backgroundColor: getColorById(habit.color) || '#E0E0E0'}]}/>
                                <View style={styles.participantDetails}>
                                    <Text style={styles.participantName}>{habit.account.displayName}</Text>
                                    <View style={styles.medalsContainer}>
                                        {getUserMedals(habit.account.authenticationId).map((medal, index) => (
                                            <View
                                                key={index}
                                                style={[
                                                    styles.medalBubble,
                                                    {backgroundColor: `#${medal.color.toString(16).padStart(6, '0')}`}
                                                ]}
                                            >
                                                <Text style={styles.medalIcon}>{medal.asciiCode}</Text>
                                                <Text style={styles.medalAmount}>{medal.amount}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            </View>
                            <View style={styles.participantProgress}>
                                <ProgressBar
                                    progress={habit.currentPercentage / 100}
                                    height={8}
                                    color="#667eea"
                                    backgroundColor={theme.surfaceTertiary}
                                />
                                <Text style={styles.participantPercentage}>
                                    {Math.round(habit.currentPercentage || 0)}%
                                </Text>
                            </View>
                        </View>
                        <View style={{flex: 1, flexDirection: 'row', alignItems: 'center'}}>
                            {isExpandedList.get(habit.uuid) && (<ActivityCalendar handleClickOnCalendarItem={() => {
                            }} handleLongClickOnCalendarItem={() => {
                            }} habit={habit}/>)}
                        </View>
                    </View>
                </View>

            ))}
        </View>
    )
}

const createStyles = createThemedStyles((theme) => StyleSheet.create({
    participantCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 5,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    participantInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 150
    },
    participantColorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 12,
    },
    participantDetails: {
        flex: 1,
    },
    participantName: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text,
    },
    medalsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 2,
        gap: 4,
    },
    medalBubble: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        backgroundColor: theme.surfaceTertiary,
        minWidth: 30,
        justifyContent: 'center',
    },
    medalIcon: {
        fontSize: 12,
        marginRight: 2,
    },
    medalAmount: {
        fontSize: 10,
        fontWeight: 'bold',
        color: theme.textSecondary,
    },
    participantProgress: {
        flex: 1
    },
    participantPercentage: {
        fontSize: 12,
        color: theme.text,
        marginTop: 5,
    },
}));

export default SharedHabitParticipants;