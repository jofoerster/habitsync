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
                        size={24}
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
                                size={24}
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
                                size={24}
                                color={canMoveDown ? theme.text : theme.textSecondary}
                            />
                        </TouchableOpacity>
                    </View>
                )}
            </TouchableOpacity>
            
            {isGroupExpanded && (
                <View style={styles.groupContent}>
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
            )}
        </View>
    );
};

const createStyles = createThemedStyles((theme) => StyleSheet.create({
    groupContainer: {
        marginBottom: 16,
    },
    groupHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.surface,
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 4,
        borderLeftWidth: 3,
        borderLeftColor: theme.primary,
    },
    groupHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    groupTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text,
        marginLeft: 8,
    },
    groupBadge: {
        backgroundColor: theme.primary,
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginLeft: 8,
    },
    groupBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    groupContent: {
        paddingLeft: 8,
    },
    groupDragControls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dragButton: {
        padding: 4,
    },
}));

export default HabitGroup;

