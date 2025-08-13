import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { createThemedStyles } from '@/constants/styles';

const ThemeToggle: React.FC = () => {
    const { theme, themeMode, setThemeMode } = useTheme();
    const styles = createStyles(theme);

    const themeOptions = [
        { mode: 'light' as const, label: 'Light', icon: 'weather-sunny' as const },
        { mode: 'dark' as const, label: 'Dark', icon: 'weather-night' as const },
        { mode: 'system' as const, label: 'System', icon: 'brightness-auto' as const },
    ];

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Theme</Text>
            <View style={styles.optionsContainer}>
                {themeOptions.map((option) => (
                    <TouchableOpacity
                        key={option.mode}
                        style={[
                            styles.option,
                            themeMode === option.mode && styles.selectedOption
                        ]}
                        onPress={() => setThemeMode(option.mode)}
                    >
                        <MaterialCommunityIcons
                            name={option.icon}
                            size={20}
                            color={
                                themeMode === option.mode
                                    ? theme.primary
                                    : theme.textSecondary
                            }
                        />
                        <Text
                            style={[
                                styles.optionText,
                                themeMode === option.mode && styles.selectedOptionText
                            ]}
                        >
                            {option.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const createStyles = createThemedStyles((theme) => StyleSheet.create({
    container: {
        backgroundColor: theme.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: theme.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: theme.shadowOpacity,
        shadowRadius: 4,
        elevation: theme.elevation.level1,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text,
        marginBottom: 12,
    },
    optionsContainer: {
        flexDirection: 'row',
        backgroundColor: theme.surfaceSecondary,
        borderRadius: 8,
        padding: 4,
    },
    option: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        gap: 6,
    },
    selectedOption: {
        backgroundColor: theme.surface,
        shadowColor: theme.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: theme.shadowOpacity,
        shadowRadius: 2,
        elevation: 1,
    },
    optionText: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.textSecondary,
    },
    selectedOptionText: {
        color: theme.primary,
        fontWeight: '600',
    },
}));

export default ThemeToggle;
