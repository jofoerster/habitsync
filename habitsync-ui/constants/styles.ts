import { StyleSheet } from 'react-native';
import { Theme } from '@/constants/colors';

export const createThemedStyles = <T extends StyleSheet.NamedStyles<T>>(
    styleFunction: (theme: Theme) => T
) => {
    return styleFunction;
};

export const commonStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    surface: {
        backgroundColor: theme.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: theme.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: theme.shadowOpacity,
        shadowRadius: 4,
        elevation: theme.elevation.level1,
    },
    surfaceSecondary: {
        backgroundColor: theme.surfaceSecondary,
        borderRadius: 8,
        padding: 12,
    },
    text: {
        color: theme.text,
        fontSize: 16,
        fontWeight: '400',
    },
    textSecondary: {
        color: theme.textSecondary,
        fontSize: 14,
        fontWeight: '400',
    },
    textTertiary: {
        color: theme.textTertiary,
        fontSize: 12,
        fontWeight: '400',
    },
    heading: {
        color: theme.text,
        fontSize: 24,
        fontWeight: 'bold',
    },
    subHeading: {
        color: theme.text,
        fontSize: 18,
        fontWeight: '600',
    },
    button: {
        backgroundColor: theme.primary,
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: theme.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: theme.shadowOpacity,
        shadowRadius: 4,
        elevation: theme.elevation.level2,
    },
    buttonText: {
        color: theme.textInverse,
        fontSize: 16,
        fontWeight: '600',
    },
    buttonSecondary: {
        backgroundColor: 'transparent',
        borderColor: theme.border,
        borderWidth: 1,
    },
    buttonSecondaryText: {
        color: theme.text,
    },
    input: {
        backgroundColor: theme.surface,
        borderColor: theme.border,
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        color: theme.text,
        fontSize: 16,
    },
    inputFocused: {
        borderColor: theme.primary,
    },
    separator: {
        height: 1,
        backgroundColor: theme.border,
        marginVertical: 8,
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.background,
    },
    loadingText: {
        fontSize: 16,
        color: theme.textSecondary,
        marginTop: 10,
    },
});

export const createShadowStyle = (theme: Theme, level: 'level1' | 'level2' | 'level3' = 'level1') => ({
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: level === 'level1' ? 1 : level === 'level2' ? 2 : 4 },
    shadowOpacity: theme.shadowOpacity,
    shadowRadius: level === 'level1' ? 2 : level === 'level2' ? 4 : 8,
    elevation: theme.elevation[level],
});
