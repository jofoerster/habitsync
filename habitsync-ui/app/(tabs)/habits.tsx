import HabitRow from '@/components/HabitRow';
import React, {useState} from 'react';
import {Animated, FlatList, Linking, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Link} from 'expo-router';
import {LinearGradient} from "expo-linear-gradient";
import {MaterialCommunityIcons} from "@expo/vector-icons";
import alert from "@/services/alert";
import {createThemedStyles} from "@/constants/styles";
import {useTheme} from "@/context/ThemeContext";
import {useHabits, useHabitUuids, useMoveHabitDown, useMoveHabitUp} from "@/hooks/useHabits";

const DateHeader = () => {
    const {theme} = useTheme();
    const styles = createStyles(theme);

    const formatDate = (date: Date): string =>
        date.toLocaleDateString('de-DE', {day: '2-digit', month: '2-digit'}).replace('/', '.');

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

    const {data: habitUuids = [], isLoading: loading, refetch} = useHabitUuids();

    const moveHabitUpMutation = useMoveHabitUp();
    const moveHabitDownMutation = useMoveHabitDown();

    const [expandedHabits, setExpandedHabits] = useState<{ [key: string]: boolean }>({});
    const [isDragModeEnabled, setIsDragModeEnabled] = useState(false);

    const toggleHabitExpansion = async (habitUuid: string) => {
        const isExpanded = expandedHabits[habitUuid];

        setExpandedHabits(prev => ({
            ...prev,
            [habitUuid]: !isExpanded
        }));
    };

    const handleMoveUp = async (habitUuid: string) => {
        try {
            await moveHabitUpMutation.mutateAsync(habitUuid);
        } catch (_error) {
            alert('Error', 'Failed to move habit up');
        }
    };

    const handleMoveDown = async (habitUuid: string) => {
        try {
            await moveHabitDownMutation.mutateAsync(habitUuid);
        } catch (_error) {
            alert('Error', 'Failed to move habit down');
        }
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
            ) : habitUuids.length === 0 ? (
                <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="target" size={64} color="#ccc"/>
                    <Text style={styles.emptyStateText}>No habits yet</Text>
                    <Text style={styles.emptyStateSubText}>Start building your first habit!</Text>
                </View>
            ) : isDragModeEnabled ? (
                <FlatList
                    data={habitUuids}
                    renderItem={({item, index}) => (
                        <HabitRow
                            key={item}
                            habitUuid={item}
                            isExpanded={expandedHabits[item]}
                            onToggleExpand={() => toggleHabitExpansion(item)}
                            isConnectedHabitView={false}
                            isChallengeHabit={false}
                            hideDates={true}
                            isDragModeEnabled={isDragModeEnabled}
                            habitIndex={index}
                            totalHabits={habitUuids.length}
                            onMoveUp={handleMoveUp}
                            onMoveDown={handleMoveDown}
                        />
                    )}
                    keyExtractor={(item) => item}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={true}
                />
            ) : (
                <FlatList
                    data={habitUuids}
                    renderItem={({item}) => (
                        <HabitRow
                            key={item}
                            habitUuid={item}
                            isExpanded={expandedHabits[item]}
                            onToggleExpand={() => toggleHabitExpansion(item)}
                            isConnectedHabitView={false}
                            isChallengeHabit={false}
                            hideDates={true}
                        />
                    )}
                    keyExtractor={(item) => item}
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
