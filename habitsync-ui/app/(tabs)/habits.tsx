import HabitRow from '@/components/HabitRow';
import HabitGroup from '@/components/HabitGroup';
import React, {useMemo, useState} from 'react';
import {Animated, FlatList, Linking, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Link} from 'expo-router';
import {LinearGradient} from "expo-linear-gradient";
import {MaterialCommunityIcons} from "@expo/vector-icons";
import alert from "@/services/alert";
import {createThemedStyles} from "@/constants/styles";
import {useTheme} from "@/context/ThemeContext";
import {useHabits, useSortHabits} from "@/hooks/useHabits";
import {useConfiguration} from "@/hooks/useConfiguration";
import {ApiHabitRead} from "@/services/api";

const DateHeader = () => {
    const {theme} = useTheme();
    const styles = createStyles(theme);

    const {data: serverConfig} = useConfiguration();
    const templateDateFormat = serverConfig?.templateDateFormat || 'DD.MM.';

    const formatDate = (date: Date): string => {
        return templateDateFormat
            .replace('DD', date.getDate().toString().padStart(2, '0'))
            .replace('MM', (date.getMonth() + 1).toString().padStart(2, '0'))
    };

    const createDay = (daysAgo: number): string => {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        return formatDate(date);
    };

    const dates = [
        createDay(0),  // today
        createDay(1), // yesterday
        createDay(2) // day before yesterday
    ];

    return (
        <View style={styles.dateHeader}>
            <View style={styles.dateHeaderContent}>
                <View style={{flex: 1}}/>
                <View style={styles.dateHeaderButtons}>
                    {dates.map((date, index) => (
                        <View key={index} style={styles.dateColumn}>
                            <Text style={styles.dateText}>{date}</Text>
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
};

const HabitTrackerScreen = () => {
    const {theme} = useTheme();
    const styles = createStyles(theme);

    const {data: habits = [], isLoading: loading} = useHabits();

    const sortHabitsMutation = useSortHabits();

    const [expandedHabits, setExpandedHabits] = useState<{ [key: string]: boolean }>({});
    const [expandedGroups, setExpandedGroups] = useState<{ [key: string]: boolean }>({});
    const [isDragModeEnabled, setIsDragModeEnabled] = useState(false);

    // Group habits by their group property and create a unified sorted list
    const groupedData = useMemo(() => {
        const groups: { [key: string]: ApiHabitRead[] } = {};
        const ungrouped: ApiHabitRead[] = [];

        habits.forEach(habit => {
            if (habit.group) {
                if (!groups[habit.group]) {
                    groups[habit.group] = [];
                }
                groups[habit.group].push(habit);
            } else {
                ungrouped.push(habit);
            }
        });

        // Sort habits within each group by sortPosition
        Object.keys(groups).forEach(groupName => {
            groups[groupName].sort((a, b) => a.sortPosition - b.sortPosition);
        });

        // Create a unified list with groups and ungrouped habits sorted by position
        type ListItem =
            | { type: 'group'; groupName: string; position: number; habits: ApiHabitRead[] }
            | { type: 'habit'; habit: ApiHabitRead; position: number };

        const items: ListItem[] = [];

        // Add groups (use the first habit's position as the group position)
        Object.keys(groups).forEach(groupName => {
            const groupHabits = groups[groupName];
            if (groupHabits.length > 0) {
                items.push({
                    type: 'group',
                    groupName,
                    position: groupHabits[0].sortPosition,
                    habits: groupHabits
                });
            }
        });

        // Add ungrouped habits
        ungrouped.forEach(habit => {
            items.push({
                type: 'habit',
                habit,
                position: habit.sortPosition
            });
        });

        // Sort all items by position
        items.sort((a, b) => a.position - b.position);

        return { groups, ungrouped, items };
    }, [habits]);

    const toggleHabitExpansion = (habitUuid: string) => {
        setExpandedHabits(prev => ({
            ...prev,
            [habitUuid]: !prev[habitUuid]
        }));
    };

    const toggleGroupExpansion = (groupName: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupName]: !prev[groupName]
        }));
    };

    const handleMoveUp = async (habitUuid: string) => {
        try {
            const habit = habits.find(h => h.uuid === habitUuid);
            if (!habit) return;

            // Find the habit immediately before this one
            const habitsBefore = habits
                .filter(h => h.sortPosition < habit.sortPosition)
                .sort((a, b) => b.sortPosition - a.sortPosition);

            if (habitsBefore.length === 0) return; // Can't move up

            const habitBefore = habitsBefore[0];

            // Find position to move to (before habitBefore)
            const habitsBeforeThat = habits
                .filter(h => h.sortPosition < habitBefore.sortPosition)
                .sort((a, b) => b.sortPosition - a.sortPosition);

            const before = habitsBeforeThat.length > 0 ? habitsBeforeThat[0].sortPosition : undefined;
            const after = habitBefore.sortPosition;

            await sortHabitsMutation.mutateAsync({
                habitUuids: [habitUuid],
                before,
                after
            });
        } catch (_error) {
            alert('Error', 'Failed to move habit up');
        }
    };

    const handleMoveDown = async (habitUuid: string) => {
        try {
            const habit = habits.find(h => h.uuid === habitUuid);
            if (!habit) return;

            // Find the habit immediately after this one
            const habitsAfter = habits
                .filter(h => h.sortPosition > habit.sortPosition)
                .sort((a, b) => a.sortPosition - b.sortPosition);

            if (habitsAfter.length === 0) return; // Can't move down

            const habitAfter = habitsAfter[0];

            // Find position to move to (after habitAfter)
            const habitsAfterThat = habits
                .filter(h => h.sortPosition > habitAfter.sortPosition)
                .sort((a, b) => a.sortPosition - b.sortPosition);

            const before = habitAfter.sortPosition;
            const after = habitsAfterThat.length > 0 ? habitsAfterThat[0].sortPosition : undefined;

            await sortHabitsMutation.mutateAsync({
                habitUuids: [habitUuid],
                before,
                after
            });
        } catch (_error) {
            alert('Error', 'Failed to move habit down');
        }
    };

    const handleMoveGroupUp = async (groupName: string) => {
        const groupHabits = groupedData.groups[groupName];
        if (groupHabits.length === 0) return;

        const firstHabitPosition = groupHabits[0].sortPosition;

        // Find the habit that comes before this group
        const allHabits = habits.filter(h => h.sortPosition < firstHabitPosition)
            .sort((a, b) => b.sortPosition - a.sortPosition);

        if (allHabits.length === 0) return; // Can't move up

        const habitBefore = allHabits[0];

        // Find position to move to (before habitBefore)
        const habitsBeforeThat = habits.filter(h => h.sortPosition < habitBefore.sortPosition)
            .sort((a, b) => b.sortPosition - a.sortPosition);

        const before = habitsBeforeThat.length > 0 ? habitsBeforeThat[0].sortPosition : undefined;
        const after = habitBefore.sortPosition;

        try {
            await sortHabitsMutation.mutateAsync({
                habitUuids: groupHabits.map(h => h.uuid),
                before,
                after
            });
        } catch (_error) {
            alert('Error', 'Failed to move group up');
        }
    };

    const handleMoveGroupDown = async (groupName: string) => {
        const groupHabits = groupedData.groups[groupName];
        if (groupHabits.length === 0) return;

        const lastHabitPosition = groupHabits[groupHabits.length - 1].sortPosition;

        // Find the habit that comes after this group
        const allHabits = habits.filter(h => h.sortPosition > lastHabitPosition)
            .sort((a, b) => a.sortPosition - b.sortPosition);

        if (allHabits.length === 0) return; // Can't move down

        const habitAfter = allHabits[0];

        // Find position to move to (after habitAfter)
        const habitsAfterThat = habits.filter(h => h.sortPosition > habitAfter.sortPosition)
            .sort((a, b) => a.sortPosition - b.sortPosition);

        const before = habitAfter.sortPosition;
        const after = habitsAfterThat.length > 0 ? habitsAfterThat[0].sortPosition : undefined;

        try {
            await sortHabitsMutation.mutateAsync({
                habitUuids: groupHabits.map(h => h.uuid),
                before,
                after
            });
        } catch (_error) {
            alert('Error', 'Failed to move group down');
        }
    };

    const canMoveGroupUp = (groupName: string): boolean => {
        const groupHabits = groupedData.groups[groupName];
        if (groupHabits.length === 0) return false;
        const firstHabitPosition = groupHabits[0].sortPosition;
        console.log(`First habit position in group "${groupName}": ${firstHabitPosition}`);
        console.log(`Can move up: ${habits.some(h => h.sortPosition < firstHabitPosition)}`);
        return habits.some(h => h.sortPosition < firstHabitPosition);
    };

    const canMoveGroupDown = (groupName: string): boolean => {
        const groupHabits = groupedData.groups[groupName];
        if (groupHabits.length === 0) return false;
        const lastHabitPosition = groupHabits[groupHabits.length - 1].sortPosition;
        console.log(`Last habit position in group "${groupName}": ${lastHabitPosition}`);
        console.log(`Can move down: ${habits.some(h => h.sortPosition > lastHabitPosition)}`);
        return habits.some(h => h.sortPosition > lastHabitPosition);
    };

    const canHabitMoveUp = (habit: ApiHabitRead, habitsInSameContext: ApiHabitRead[]): boolean => {
        const index = habitsInSameContext.findIndex(h => h.uuid === habit.uuid);
        return index > 0;
    };

    const canHabitMoveDown = (habit: ApiHabitRead, habitsInSameContext: ApiHabitRead[]): boolean => {
        const index = habitsInSameContext.findIndex(h => h.uuid === habit.uuid);
        return index < habitsInSameContext.length - 1;
    };

    const openHelp = () => {
        Linking.openURL('https://github.com/jofoerster/habitsync/blob/main/FAQ.md');
    };

    return (
        <View style={styles.container}>
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                <View style={styles.headerContainer}>
                    <Animated.Image
                        source={require('@/assets/images/logo-transparent.png')}
                        style={[
                            styles.logo,
                        ]}
                    />
                    <Text style={styles.header}>HabitSync</Text>
                </View>
                <View style={styles.topRightButtons}>
                    <MaterialCommunityIcons.Button
                        name="help-circle"
                        backgroundColor={theme.background}
                        color={theme.text}
                        size={14}
                        style={{marginRight: 0, marginTop: 16}}
                        onPress={openHelp}
                    />
                    <MaterialCommunityIcons.Button
                        name="pencil"
                        backgroundColor={theme.background}
                        color={isDragModeEnabled ? "#ff0000" : theme.text}
                        size={14}
                        style={{marginRight: 16, marginTop: 16}}
                        onPress={() => setIsDragModeEnabled(!isDragModeEnabled)}
                    />
                </View>
            </View>
            <DateHeader/>
            {loading ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>Loading your habits...</Text>
                </View>
            ) : habits.length === 0 ? (
                <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="target" size={64} color="#ccc"/>
                    <Text style={styles.emptyStateText}>No habits yet</Text>
                    <Text style={styles.emptyStateSubText}>Start building your first habit!</Text>
                </View>
            ) : (
                <FlatList
                    data={groupedData.items}
                    renderItem={({item, index}) => {
                        if (item.type === 'habit') {
                            // Render individual ungrouped habit
                            const habit = item.habit;

                            // Find all ungrouped habits to determine move capabilities
                            const allUngroupedHabits = groupedData.items
                                .filter(i => i.type === 'habit')
                                .map(i => (i as { type: 'habit'; habit: ApiHabitRead }).habit);

                            return (
                                <HabitRow
                                    key={habit.uuid}
                                    habitUuid={habit.uuid}
                                    isExpanded={expandedHabits[habit.uuid]}
                                    onToggleExpand={() => toggleHabitExpansion(habit.uuid)}
                                    isConnectedHabitView={false}
                                    isChallengeHabit={false}
                                    hideDates={true}
                                    isDragModeEnabled={isDragModeEnabled}
                                    habitIndex={allUngroupedHabits.findIndex(h => h.uuid === habit.uuid)}
                                    totalHabits={allUngroupedHabits.length}
                                    onMoveUp={canHabitMoveUp(habit, allUngroupedHabits) ? handleMoveUp : undefined}
                                    onMoveDown={canHabitMoveDown(habit, allUngroupedHabits) ? handleMoveDown : undefined}
                                />
                            );
                        } else {
                            // Render group
                            const groupName = item.groupName;
                            const groupHabits = item.habits;

                            return (
                                <HabitGroup
                                    key={groupName}
                                    groupName={groupName}
                                    habitUuids={groupHabits.map(h => h.uuid)}
                                    expandedHabits={expandedHabits}
                                    onToggleHabitExpand={toggleHabitExpansion}
                                    isGroupExpanded={expandedGroups[groupName] !== false}
                                    onToggleGroupExpand={() => toggleGroupExpansion(groupName)}
                                    isDragModeEnabled={isDragModeEnabled}
                                    canMoveUp={canMoveGroupUp(groupName)}
                                    canMoveDown={canMoveGroupDown(groupName)}
                                    onMoveGroupUp={() => handleMoveGroupUp(groupName)}
                                    onMoveGroupDown={() => handleMoveGroupDown(groupName)}
                                    onMoveHabitUp={handleMoveUp}
                                    onMoveHabitDown={handleMoveDown}
                                />
                            );
                        }
                    }}
                    keyExtractor={(item, index) =>
                        item.type === 'habit' ? item.habit.uuid : `group-${item.groupName}`
                    }
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
            {/* Floating Action Button */}
            <Link href="/habit/edit/new" asChild>
                <TouchableOpacity style={styles.fab}>
                    <LinearGradient
                        colors={['#667eea', '#764ba2']}
                        style={styles.fabGradient}
                    >
                        <MaterialCommunityIcons name="plus" size={45} color="white"/>
                    </LinearGradient>
                </TouchableOpacity>
            </Link>
        </View>
    );
};

const createStyles = createThemedStyles((theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 13,
        marginTop: 16,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 16,
        marginTop: 26,

    },
    logo: {
        width: 32,
        height: 32,
        marginRight: 8,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 6,
        paddingBottom: 100, // Space for FAB
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.background,
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
        marginTop: 10,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyStateText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#666',
        marginTop: 16,
    },
    emptyStateSubText: {
        fontSize: 14,
        color: '#999',
        marginTop: 8,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    fabGradient: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dateHeader: {
        paddingHorizontal: 16,
        backgroundColor: theme.background,
    },
    dateHeaderContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 4,
    },
    dateHeaderButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        width: 132, // 3 buttons * 36px width + 3 * 8px margin = 132px
        marginLeft: 'auto',
    },
    dateColumn: {
        width: 44, // 36px button + 8px margin
        alignItems: 'center',
    },
    dateText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.text,
        textAlign: 'center',
    },
    plusIcon: {
        color: '#fff',
        fontSize: 46,
    },
    topRightButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
}));

export default HabitTrackerScreen;
