import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Platform, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useRouter, useLocalSearchParams} from "expo-router";
import {ApiHabitRead, ApiHabitWrite, habitApi} from "@/services/api";
import alert from "@/services/alert";
import HabitConfig, {ConfigType} from "@/components/HabitConfig";
import {useTheme} from "@/context/ThemeContext";
import {createThemedStyles} from "@/constants/styles";

const HabitEditScreen = () => {
    const {theme} = useTheme();
    const styles = createStyles(theme);

    const router = useRouter();
    const configParam = useLocalSearchParams()['habitUuid'] as string;
    const isNewHabit = !configParam || configParam === 'new';
    const habitUuid = isNewHabit ? undefined : configParam;


    const [loading, setLoading] = useState(true);
    const [habit, setHabit] = useState<ApiHabitRead | null>(null);

    useEffect(() => {
        const fetchHabit = async () => {
            try {
                const habit: ApiHabitRead = await habitApi.getHabitByUuid(habitUuid);
                setHabit(habit);
                setLoading(false);
            } catch (error) {
                alert('Error', 'Failed to fetch habit data');
                router.back();
            }
        };

        if (habitUuid) {
            fetchHabit();
        } else {
            setLoading(false);
        }
    }, [habitUuid]);

    const handleUpdate = async (habitWrite: ApiHabitWrite) => {
        try {
            let newUuid = habitUuid;
            if (habitUuid) {
                await habitApi.updateHabit(habitWrite);
            } else {
                newUuid = (await habitApi.createHabit(habitWrite)).uuid;
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