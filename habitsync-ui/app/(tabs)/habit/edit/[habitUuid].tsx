import React from 'react';
import {ActivityIndicator, Platform, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useLocalSearchParams, useRouter} from "expo-router";
import {ApiHabitWrite} from "@/services/api";
import alert from "@/services/alert";
import HabitConfig, {ConfigType} from "@/components/HabitConfig";
import {useTheme} from "@/context/ThemeContext";
import {createThemedStyles} from "@/constants/styles";
import {useCreateHabit, useHabit, useUpdateHabit} from "@/hooks/useHabits";

const HabitEditScreen = () => {
    const {theme} = useTheme();
    const styles = createStyles(theme);

    const router = useRouter();
    const configParam = useLocalSearchParams()['habitUuid'] as string;
    const isNewHabit = !configParam || configParam === 'new';
    const habitUuid = isNewHabit ? undefined : configParam;

    const {data: habit, isLoading: loading} = useHabit(habitUuid || '', !isNewHabit);
    const createHabitMutation = useCreateHabit();
    const updateHabitMutation = useUpdateHabit();

    const handleUpdate = async (habitWrite: ApiHabitWrite) => {
        try {
            let newUuid = habitUuid;
            if (habitUuid) {
                await updateHabitMutation.mutateAsync(habitWrite);
            } else {
                const createdHabit = await createHabitMutation.mutateAsync(habitWrite);
                newUuid = createdHabit.uuid;
            }
            router.push(`/habit/${newUuid}?isOwnHabit=true`);
        } catch (error) {
            alert('Error', 'Failed to update habit');
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4ECDC4"/>
                <Text style={styles.loadingText}>Loading habit...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
                <Text style={styles.title}>Edit Habit</Text>
                <Text style={styles.subtitle}>Customize your habit settings</Text>
            </View>

            <HabitConfig habit={habit ?? undefined} configType={ConfigType.HABIT} callbackMethod={handleUpdate}/>
        </ScrollView>
    );
};

const createStyles = createThemedStyles((theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.background,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: theme.textSecondary,
    },
    header: {
        padding: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        backgroundColor: theme.background,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    title: {
        fontSize: 25,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: theme.textSecondary,
    }
}));

export default HabitEditScreen;