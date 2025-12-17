import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createThemedStyles } from '@/constants/styles';
import { useTheme } from '@/context/ThemeContext';
import HabitRow from './HabitRow';

interface HabitGroupProps {
    groupName: string;
    habitUuids: string[];
    expandedHabits: { [key: string]: boolean };
    onToggleHabitExpand: (habitUuid: string) => void;
    isGroupExpanded: boolean;
    onToggleGroupExpand: () => void;
    isDragModeEnabled?: boolean;
    canMoveUp: boolean;
    canMoveDown: boolean;
    onMoveGroupUp: () => void;
    onMoveGroupDown: () => void;
    onMoveHabitUp?: (habitUuid: string) => void;
    onMoveHabitDown?: (habitUuid: string) => void;
}

const HabitGroup: React.FC<HabitGroupProps> = ({
    groupName,
    habitUuids,
    expandedHabits,
    onToggleHabitExpand,
    isGroupExpanded,
    onToggleGroupExpand,
    isDragModeEnabled,
    canMoveUp,
    canMoveDown,
    onMoveGroupUp,
    onMoveGroupDown,
    onMoveHabitUp,
    onMoveHabitDown
}) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);

    return (
        <View style={styles.groupContainer}>
            <TouchableOpacity 
                style={styles.groupHeader}
                onPress={onToggleGroupExpand}
                activeOpacity={0.7}
            >
                <View style={styles.groupHeaderLeft}>
                    <MaterialCommunityIcons
                        name={isGroupExpanded ? "chevron-down" : "chevron-right"}
                        size={20}
                        color={theme.text}
                    />
                    <Text style={styles.groupTitle}>{groupName}</Text>
                    <View style={styles.groupBadge}>
                        <Text style={styles.groupBadgeText}>{habitUuids.length}</Text>
                    </View>
                </View>
                {isDragModeEnabled && (
                    <View style={styles.groupDragControls}>
                        <TouchableOpacity
                            onPress={onMoveGroupUp}
                            disabled={!canMoveUp}
                            style={styles.dragButton}
                        >
                            <MaterialCommunityIcons
                                name="chevron-up"
                                size={20}
                                color={canMoveUp ? theme.text : theme.textSecondary}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={onMoveGroupDown}
                            disabled={!canMoveDown}
                            style={styles.dragButton}
                        >
                            <MaterialCommunityIcons
                                name="chevron-down"
                                size={20}
                                color={canMoveDown ? theme.text : theme.textSecondary}
                            />
                        </TouchableOpacity>
                    </View>
                )}
            </TouchableOpacity>
            
            {isGroupExpanded && (
                <View style={styles.groupContent}>
                    <View style={styles.habitList}>
                        {habitUuids.map((habitUuid, index) => (
                            <HabitRow
                                key={habitUuid}
                                habitUuid={habitUuid}
                                isExpanded={expandedHabits[habitUuid]}
                                onToggleExpand={() => onToggleHabitExpand(habitUuid)}
                                isConnectedHabitView={false}
                                isChallengeHabit={false}
                                hideDates={true}
                                isDragModeEnabled={isDragModeEnabled}
                                habitIndex={index}
                                totalHabits={habitUuids.length}
                                onMoveUp={onMoveHabitUp}
                                onMoveDown={onMoveHabitDown}
                            />
                        ))}
                    </View>
                </View>
            )}
        </View>
    );
};

const createStyles = createThemedStyles((theme) => StyleSheet.create({
    groupContainer: {
        marginBottom: 13,
        borderColor: theme.surfaceTertiary,
        borderWidth: 2,
        borderRadius: 8,
    },
    groupHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.surface,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
        marginBottom: 4,
    },
    groupHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    groupTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.text,
        marginLeft: 4,
    },
    groupBadge: {
        backgroundColor: theme.surfaceSecondary,
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        paddingHorizontal: 5,
        marginLeft: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    groupBadgeText: {
        color: theme.textSecondary,
        fontSize: 10,
        fontWeight: '600',
    },
    groupContent: {
        marginTop: 0,
    },
    habitList: {
        borderRadius: 0,
        paddingTop: 15,
        paddingHorizontal: 0,
        paddingBottom: 0,
        paddingLeft: 8,
    },
    groupDragControls: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 4,
    },
    dragButton: {
        padding: 4,
        marginLeft: 1,
    },
}));

export default HabitGroup;

