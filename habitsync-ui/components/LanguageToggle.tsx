import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {useTranslation} from 'react-i18next';
import {useTheme} from '@/context/ThemeContext';
import {createThemedStyles} from '@/constants/styles';
import {LANGUAGE_LABELS, setAppLanguage, SUPPORTED_LANGUAGES, SupportedLanguage} from '@/i18n';

const LanguageToggle: React.FC = () => {
    const {theme} = useTheme();
    const {t, i18n} = useTranslation();
    const styles = createStyles(theme);

    const current = (i18n.language?.split('-')[0] ?? 'en') as SupportedLanguage;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{t('settings.language')}</Text>
            <View style={styles.optionsContainer}>
                {SUPPORTED_LANGUAGES.map((lang) => (
                    <TouchableOpacity
                        key={lang}
                        style={[styles.option, current === lang && styles.selectedOption]}
                        onPress={() => setAppLanguage(lang)}
                    >
                        <MaterialCommunityIcons
                            name="translate"
                            size={20}
                            color={current === lang ? theme.primary : theme.textSecondary}
                        />
                        <Text style={[styles.optionText, current === lang && styles.selectedOptionText]}>
                            {LANGUAGE_LABELS[lang]}
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
        shadowOffset: {width: 0, height: 2},
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
        shadowOffset: {width: 0, height: 1},
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

export default LanguageToggle;
