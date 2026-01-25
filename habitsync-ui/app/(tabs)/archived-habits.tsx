import React from 'react';
import {ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {MaterialCommunityIcons} from "@expo/vector-icons";
import alert from "@/services/alert";
import {createThemedStyles} from "@/constants/styles";
import {useTheme} from "@/context/ThemeContext";
import {useArchivedHabits, useUpdateHabit} from "@/hooks/useHabits";
import {ApiHabitRead, HabitStatusFilter} from "@/services/api";
import {useRouter} from "expo-router";

const ArchivedHabitsScreen = () => {
    const {theme} = useTheme();
    const styles = createStyles(theme);
    const router = useRouter();

    const {data: archivedHabits = [], isLoading: loading} = useArchivedHabits();
    const updateHabitMutation = useUpdateHabit();

    const handleRestore = async (habit: ApiHabitRead) => {
        try {
            await updateHabitMutation.mutateAsync({
                uuid: habit.uuid,
                name: habit.name,
                color: habit.color,
                progressComputation: habit.progressComputation,
                status: HabitStatusFilter.ACTIVE,
            });
            alert('Success', 'Habit restored successfully');
        } catch {
            alert('Error', 'Failed to restore habit');
        }
    };

    const handleDelete = async (habit: ApiHabitRead) => {
        alert(
            'Confirm Deletion',
            `Are you sure you want to permanently delete "${habit.name}"? This action cannot be undone.`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await updateHabitMutation.mutateAsync({
                                uuid: habit.uuid,
                                name: habit.name,
                                color: habit.color,
                                progressComputation: habit.progressComputation,
                                status: HabitStatusFilter.DELETED,
                            });
                            alert('Success', 'Habit permanently deleted');
                        } catch {
                            alert('Error', 'Failed to delete habit');
                        }
                    }
                }
            ]
        );
    };

    const renderHabitItem = ({item}: {item: ApiHabitRead}) => (
        <View style={styles.habitItem}>
            <View style={styles.habitInfo}>
                <View style={[styles.colorIndicator, {backgroundColor: `#${item.color?.toString(16).padStart(6, '0')}`}]}/>
                <Text style={styles.habitName}>{item.name}</Text>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleRestore(item)}
                >
                    <MaterialCommunityIcons name="restore" size={24} color={theme.primary}/>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDelete(item)}
                >
                    <MaterialCommunityIcons name="delete-forever" size={24} color={theme.error}/>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.headerSection}>
                    <View>
                        <Text style={styles.header}>Archived Habits</Text>
                        <Text style={styles.subHeader}>Restore or permanently delete habits</Text>
                    </View>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary}/>
                    <Text style={styles.loadingText}>Loading archived habits...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.headerSection}>
                <View>
                    <Text style={styles.header}>Archived Habits</Text>
                    <Text style={styles.subHeader}>Restore or permanently delete habits</Text>
                </View>
            </View>

            {archivedHabits.length === 0 ? (
                <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="archive-outline" size={64} color="#ccc"/>
                    <Text style={styles.emptyStateText}>No archived habits</Text>
                    <Text style={styles.emptyStateSubText}>Archived habits will appear here</Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollContainer}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                >
                    {archivedHabits.map((item) => (
                        <View key={item.uuid} style={styles.habitItem}>
                            <View style={styles.habitInfo}>
                                <View style={[styles.colorIndicator, {backgroundColor: `#${item.color?.toString(16).padStart(6, '0')}`}]}/>
                                <Text style={styles.habitName}>{item.name}</Text>
                            </View>
                            <View style={styles.actions}>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => handleRestore(item)}
                                >
                                    <MaterialCommunityIcons name="restore" size={24} color={theme.primary}/>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => handleDelete(item)}
                                >
                                    <MaterialCommunityIcons name="delete-forever" size={24} color={theme.error}/>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            )}
        </View>
    );
};

const createStyles = createThemedStyles((theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    headerSection: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingLeft: 20,
        paddingRight: 20,
        paddingBottom: 16,
        backgroundColor: theme.background,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
        marginTop: 42,
        marginRight: 8,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 8,
        marginTop: 42,
    },
    subHeader: {
        fontSize: 14,
        color: theme.textSecondary,
        fontWeight: '400',
    },
    scrollContainer: {
        flex: 1,
    },
    listContent: {
        padding: 16,
        paddingBottom: 32,
    },
    habitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: theme.shadow,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: theme.shadowOpacity,
        shadowRadius: 4,
        elevation: theme.elevation.level1,
    },
    habitInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    colorIndicator: {
        width: 4,
        height: 40,
        borderRadius: 2,
        marginRight: 12,
    },
    habitName: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text,
        flex: 1,
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
        marginLeft: 12,
    },
    actionButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: theme.surfaceSecondary,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: theme.textSecondary,
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
        color: theme.textSecondary,
        marginTop: 16,
    },
    emptyStateSubText: {
        fontSize: 14,
        color: theme.textTertiary,
        marginTop: 8,
    },
}));

export default ArchivedHabitsScreen;

