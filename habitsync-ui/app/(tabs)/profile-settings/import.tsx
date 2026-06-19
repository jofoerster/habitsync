import React, {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Platform
} from 'react-native';
import {importApi} from '@/services/api';
import alert from '@/services/alert';
import {useTheme} from '@/context/ThemeContext';
import {createThemedStyles} from '@/constants/styles';
import {MaterialCommunityIcons} from '@expo/vector-icons';

const ImportScreen = () => {
    const {t} = useTranslation();
    const {theme} = useTheme();
    const styles = createStyles(theme);

    const [uploading, setUploading] = useState(false);

    const handleFileSelect = async () => {
        if (Platform.OS === 'web') {
            // Web file picker
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.db,application/db';
            input.onchange = async (e: any) => {
                const file = e.target.files[0];
                if (file) {
                    await uploadFile(file);
                }
            };
            input.click();
        } else {
            // Mobile - would need expo-document-picker or similar
            alert(t('import.infoTitle'), t('import.webOnly'));
        }
    };

    const uploadFile = async (file: File | Blob) => {
        try {
            setUploading(true);
            await importApi.importLoopHabit(file);
            alert(t('common.success'), t('import.importSuccess'));
        } catch (error) {
            console.error('Failed to upload file', error);
            alert(t('common.error'), t('import.uploadFailed'));
        } finally {
            setUploading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View>
                <Text style={styles.header}>{t('import.title')}</Text>
                <Text style={styles.subHeader}>{t('import.subtitle')}</Text>
            </View>

            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                {/* Loop Habit Tracker Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons
                            name="file-import"
                            size={24}
                            color={theme.primary}
                            style={{marginRight: 8}}
                        />
                        <Text style={styles.sectionTitle}>Loop Habit Tracker</Text>
                    </View>

                    <View style={styles.instructionsContainer}>
                        <Text style={styles.instructionsTitle}>{t('import.howToExport')}</Text>
                        <View style={styles.instructionStep}>
                            <Text style={styles.stepNumber}>1.</Text>
                            <Text style={styles.stepText}>{t('import.step1')}</Text>
                        </View>
                        <View style={styles.instructionStep}>
                            <Text style={styles.stepNumber}>2.</Text>
                            <Text style={styles.stepText}>{t('import.step2')}</Text>
                        </View>
                        <View style={styles.instructionStep}>
                            <Text style={styles.stepNumber}>3.</Text>
                            <Text style={styles.stepText}>{t('import.step3')}</Text>
                        </View>
                    </View>

                    <View style={styles.featuresContainer}>
                        <Text style={styles.featuresTitle}>{t('import.whatImported')}</Text>
                        <View style={styles.featureItem}>
                            <MaterialCommunityIcons name="check-circle" size={16} color={theme.success} />
                            <Text style={styles.featureText}>{t('import.featureHabits')}</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <MaterialCommunityIcons name="check-circle" size={16} color={theme.success} />
                            <Text style={styles.featureText}>{t('import.featureCompletionRecords')}</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <MaterialCommunityIcons name="checkbox-blank-circle-outline" size={16} color={theme.warning} />
                            <Text style={styles.featureText}>{t('import.featureFrequency')}</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <MaterialCommunityIcons name="checkbox-blank-circle-outline" size={16} color={theme.warning} />
                            <Text style={styles.featureText}>{t('import.featureProgress')}</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <MaterialCommunityIcons name="alert-circle" size={16} color={theme.error} />
                            <Text style={styles.featureText}>{t('import.featureNotes')}</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
                        onPress={handleFileSelect}
                        disabled={uploading}
                    >
                        {uploading ? (
                            <>
                                <ActivityIndicator color={theme.textInverse} style={{marginRight: 8}} />
                                <Text style={styles.uploadButtonText}>{t('import.uploading')}</Text>
                            </>
                        ) : (
                            <>
                                <MaterialCommunityIcons
                                    name="upload"
                                    size={20}
                                    color={theme.textInverse}
                                    style={{marginRight: 8}}
                                />
                                <Text style={styles.uploadButtonText}>{t('import.selectBackupFile')}</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Placeholder for future import options */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons
                            name="dots-horizontal"
                            size={24}
                            color={theme.textSecondary}
                            style={{marginRight: 8}}
                        />
                        <Text style={styles.sectionTitle}>{t('import.moreOptions')}</Text>
                    </View>
                    <Text style={styles.placeholderText}>
                        {t('import.moreOptionsPlaceholder')}
                    </Text>
                </View>
            </ScrollView>
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
        marginBottom: 8,
        marginTop: 42,
        paddingLeft: 16,
    },
    subHeader: {
        fontSize: 14,
        color: theme.textSecondary,
        fontWeight: '400',
        paddingLeft: 16,
    },
    scrollContainer: {
        flex: 1,
        padding: 16,
    },
    section: {
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
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.text,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.surfaceSecondary,
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderLeftWidth: 3,
        borderLeftColor: theme.info,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: theme.text,
        lineHeight: 20,
    },
    instructionsContainer: {
        backgroundColor: theme.surfaceSecondary,
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    instructionsTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.text,
        marginBottom: 12,
    },
    instructionStep: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    stepNumber: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.primary,
        marginRight: 8,
        width: 20,
    },
    stepText: {
        flex: 1,
        fontSize: 14,
        color: theme.textSecondary,
        lineHeight: 20,
    },
    featuresContainer: {
        backgroundColor: theme.surfaceSecondary,
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    featuresTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.text,
        marginBottom: 12,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    featureText: {
        fontSize: 14,
        color: theme.textSecondary,
    },
    uploadButton: {
        backgroundColor: theme.primary,
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: theme.shadow,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: theme.shadowOpacity,
        shadowRadius: 4,
        elevation: theme.elevation.level2,
    },
    uploadButtonDisabled: {
        backgroundColor: theme.disabled,
    },
    uploadButtonText: {
        color: theme.textInverse,
        fontSize: 16,
        fontWeight: '600',
    },
    placeholderText: {
        fontSize: 14,
        color: theme.textSecondary,
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 12,
    },
}));

export default ImportScreen;

