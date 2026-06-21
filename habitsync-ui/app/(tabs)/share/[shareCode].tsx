import React, {useEffect, useRef, useState} from 'react';
import {
    ActivityIndicator,
    Dimensions,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import {ApiAccountRead, ApiComputationReadWrite, ApiHabitRead, FrequencyTypeDTO} from '@/services/api';
import {MaterialCommunityIcons} from "@expo/vector-icons";
import {useLocalSearchParams, useRouter} from "expo-router";
import {getColorById} from "@/constants/colors";
import alert from "@/services/alert";
import * as Clipboard from 'expo-clipboard';
import HabitConfig, {ConfigType, HabitConfigRef} from "@/components/HabitConfig";
import SharedHabitParticipants from "@/components/SharedHabitParticipants";
import {useTheme} from "@/context/ThemeContext";
import {createThemedStyles} from "@/constants/styles";
import {UI_BASE_URL} from "@/public/config";
import {AuthService} from "@/services/auth";
import {useDeleteSharedHabit, useJoinSharedHabit, useSharedHabit, useUpdateSharedHabit} from "@/hooks/useSharedHabits";
import {useHabits} from "@/hooks/useHabits";
import {useTranslation} from 'react-i18next';

const {width} = Dimensions.get('window');

const SharedHabitDetailsScreen = () => {
    const {t} = useTranslation();
    const {theme} = useTheme();
    const styles = createStyles(theme);

    const router = useRouter();
    const shareCode = useLocalSearchParams()['shareCode'] as string;

    const editModeEnabled = useLocalSearchParams()['edit'] === 'true';

    const {data: sharedHabit, isLoading: sharedHabitLoading} = useSharedHabit(shareCode);
    const {data: userHabits, isLoading: userHabitsLoading} = useHabits();

    const updateSharedHabit = useUpdateSharedHabit();
    const joinSharedHabit = useJoinSharedHabit();
    const deleteSharedHabit = useDeleteSharedHabit();

    const [currentUser, setCurrentUser] = useState<ApiAccountRead>();
    const [isEditing, setIsEditing] = useState(editModeEnabled);
    const [editedTitle, setEditedTitle] = useState('');
    const [editedDescription, setEditedDescription] = useState('');
    const [allowEditingOfAllUsers, setAllowEditingOfAllUsers] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);

    const habitConfigRef = useRef<HabitConfigRef>(null);

    useEffect(() => {
        const getCurrentUser = async () => {
            try {
                const user = await AuthService.getInstance().getCurrentUser();
                setCurrentUser(user);
            } catch (error) {
                console.error('Error fetching current user:', error);
            }
        };
        getCurrentUser();
    }, []);

    const getHabitForProgressComputation = (): Partial<ApiHabitRead> => {
        return {
            account: {displayName: "", authenticationId: "", email: ""},
            color: 0,
            currentPercentage: 0,
            name: "",
            uuid: "",
            progressComputation: sharedHabit!.progressComputation!,
            sortPosition: 0
        }
    }

    const userHasHabitInSharedHabit = () => {
        if (!sharedHabit || !currentUser) return false;
        return sharedHabit.habits.some(habit => habit.account.authenticationId === currentUser.authenticationId);
    };

    const canEdit = () => {
        if (!sharedHabit || !currentUser) return false;
        return sharedHabit.owner.authenticationId === currentUser.authenticationId ||
            sharedHabit.allowEditingOfAllUsers;
    };

    const handleSaveEdit = async () => {
        if (!sharedHabit) return;

        try {
            const updatedHabitData = await habitConfigRef.current?.save();
            if (!updatedHabitData) return;

            await updateSharedHabit.mutateAsync({
                sharedHabit: {
                    title: editedTitle,
                    habitUuid: sharedHabit.habits.find(h => h.account.authenticationId === sharedHabit.owner.authenticationId)?.uuid,
                    description: editedDescription,
                    allowEditingOfAllUsers: allowEditingOfAllUsers,
                    progressComputation: updatedHabitData.progressComputation
                }, shareCode
            })
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating shared habit:', error);
            alert(t('common.error'), t('share.errorUpdate'));
        }
    };

    const handleJoinWithNewHabit = async () => {
        try {
            await joinSharedHabit.mutateAsync({shareCode})
            setShowJoinModal(false);
            alert(t('common.success'), t('share.joinedNewHabit'));
        } catch (error) {
            console.error('Error joining with new habit:', error);
            alert(t('common.error'), t('share.errorJoin'));
        }
    };

    const handleJoinWithExistingHabit = (habitUuid: string) => {
        alert(
            t('share.joinExistingTitle'),
            t('share.joinExistingMessage'),
            [
                {
                    text: t('common.cancel'),
                    style: 'cancel'
                },
                {
                    text: t('share.join'),
                    onPress: async () => {
                        try {
                            await joinSharedHabit.mutateAsync({shareCode, habitUuid})
                            setShowJoinModal(false);
                            alert(t('common.success'), t('share.joinedExistingHabit'));
                        } catch (error) {
                            console.error('Error joining with existing habit:', error);
                            alert(t('common.error'), t('share.errorJoin'));
                        }
                    }
                }
            ]
        );
    };

    const handleDeleteSharedHabit = () => {
        if (!sharedHabit) return;

        alert(
            t('share.deleteTitle'),
            t('share.deleteMessage'),
            [
                {
                    text: t('common.cancel'),
                    style: 'cancel'
                },
                {
                    text: t('common.delete'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteSharedHabit.mutateAsync({
                                sharedHabit: {
                                    title: sharedHabit.title,
                                    habitUuid: sharedHabit.habits.find(h => h.account.authenticationId === sharedHabit.owner.authenticationId)?.uuid,
                                    description: sharedHabit.description,
                                    allowEditingOfAllUsers: sharedHabit.allowEditingOfAllUsers,
                                    progressComputation: sharedHabit.progressComputation!
                                }, shareCode
                            })
                            router.push('/habits');
                        } catch (error) {
                            console.error('Error deleting shared habit:', error);
                            alert(t('common.error'), t('share.errorDelete'));
                        }
                    }
                }
            ]
        );
    };

    const formatFrequency = (progressComputation: ApiComputationReadWrite) => {
        const {frequencyType, frequency, timesPerXDays} = progressComputation;

        if (frequencyType === FrequencyTypeDTO.WEEKLY) {
            return t('share.timesPerWeek', {frequency});
        } else if (frequencyType === FrequencyTypeDTO.MONTHLY) {
            return t('share.timesPerMonth', {frequency});
        } else if (frequencyType === FrequencyTypeDTO.X_TIMES_PER_Y_DAYS) {
            return t('share.timesPerXDays', {frequency, days: timesPerXDays});
        }
        return t('share.customFrequency');
    };

    const renderJoinModal = () => {
        if (!showJoinModal) return null;

        return (
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>{t('share.joinModalTitle')}</Text>
                    <Text style={styles.modalDescription}>
                        {t('share.joinModalDescription')}
                    </Text>

                    <TouchableOpacity
                        style={styles.modalButton}
                        onPress={handleJoinWithNewHabit}
                    >
                        <MaterialCommunityIcons name="plus-circle" size={24} color="#2196F3"/>
                        <Text style={styles.modalButtonText}>{t('share.createNewHabit')}</Text>
                    </TouchableOpacity>

                    {userHabits && userHabits.length > 0 && (
                        <>
                            <Text style={styles.modalSectionTitle}>{t('share.orConnectExisting')}</Text>
                            {userHabits.map(userHabit => (
                                <TouchableOpacity
                                    key={userHabit.uuid}
                                    style={styles.existingHabitOption}
                                    onPress={() => handleJoinWithExistingHabit(userHabit.uuid)}
                                >
                                    <View
                                        style={[styles.habitColorDot, {backgroundColor: getColorById(userHabit.color) || '#E0E0E0'}]}/>
                                    <Text style={styles.existingHabitName}>{userHabit.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </>
                    )}

                    <TouchableOpacity
                        style={styles.modalCancelButton}
                        onPress={() => setShowJoinModal(false)}
                    >
                        <Text style={styles.modalCancelButtonText}>{t('common.cancel')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const handleCopy = async () => {
        if (sharedHabit) {
            await Clipboard.setStringAsync(`${UI_BASE_URL}/share/${sharedHabit.shareCode}`);
        }
    };

    if (sharedHabitLoading || userHabitsLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2196F3"/>
            </View>
        );
    }

    if (!sharedHabit) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{t('share.notFound')}</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <View style={styles.habitIcon}>
                        <MaterialCommunityIcons
                            name="account-group"
                            size={40}
                            color="#2196F3"
                        />
                    </View>
                    <View style={styles.headerText}>
                        {isEditing ? (
                            <TextInput
                                style={styles.titleInput}
                                value={editedTitle}
                                onChangeText={setEditedTitle}
                                placeholder={t('share.habitTitlePlaceholder')}
                            />
                        ) : (
                            <Text style={styles.habitName}>{sharedHabit.title}</Text>
                        )}
                        <Text style={styles.ownerName}>{t('share.byOwner', {name: sharedHabit.owner.displayName})}</Text>
                    </View>
                </View>
            </View>

            {/* Copy Link Button */}
            {userHasHabitInSharedHabit() && (
                <View style={styles.copyLinkSection}>
                    <TouchableOpacity
                        style={styles.copyLinkButton}
                        onPress={handleCopy}
                    >
                        <MaterialCommunityIcons name="content-copy" size={24} color="#FFFFFF"/>
                        <Text style={styles.copyLinkButtonText}>{t('share.copyLinkToShare')}</Text>
                    </TouchableOpacity>
                </View>)}

            {/* Description */}
            <View style={styles.descriptionSection}>
                <Text style={styles.sectionTitle}>{t('share.description')}</Text>
                {isEditing ? (
                    <TextInput
                        style={styles.descriptionInput}
                        value={editedDescription}
                        onChangeText={setEditedDescription}
                        placeholder={t('share.descriptionPlaceholder')}
                        multiline
                    />
                ) : (
                    <Text style={styles.descriptionText}>
                        {sharedHabit.description || t('share.noDescription')}
                    </Text>
                )}
            </View>

            {/* Join Button for non-participants */}
            {!userHasHabitInSharedHabit() && (
                <View style={styles.joinSection}>
                    <TouchableOpacity
                        style={styles.joinButton}
                        onPress={() => setShowJoinModal(true)}
                    >
                        <MaterialCommunityIcons name="account-plus" size={24} color="#FFFFFF"/>
                        <Text style={styles.joinButtonText}>{t('share.joinThisHabit')}</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Progress Section */}
            {!isEditing ? (
                    <View style={styles.progressSection}>
                        <View style={styles.progressCard}>
                            <Text style={styles.sectionTitle}>{t('share.progressDetails')}</Text>


                            <View style={styles.progressDetails}>
                                <View style={styles.progressDetailItem}>
                                    <MaterialCommunityIcons name="target" size={20} color="#2196F3"/>
                                    <Text style={styles.progressDetailText}>
                                        {t('share.percentageOfLastDays', {days: sharedHabit.progressComputation?.targetDays})}
                                    </Text>
                                </View>

                                <View style={styles.progressDetailItem}>
                                    <MaterialCommunityIcons name="calendar-clock" size={20} color="#FF9800"/>
                                    <Text style={styles.progressDetailText}>
                                        {formatFrequency(sharedHabit.progressComputation!)}
                                    </Text>
                                </View>

                                {sharedHabit.progressComputation?.dailyDefault !== "1" && (
                                    <View style={styles.progressDetailItem}>
                                        <MaterialCommunityIcons name="flag" size={20} color="#4CAF50"/>
                                        <Text style={styles.progressDetailText}>
                                            {t('share.dailyDefault', {value: sharedHabit.progressComputation?.dailyDefault})}
                                        </Text>
                                    </View>
                                )}

                                {sharedHabit.progressComputation?.unit && (
                                    <View style={styles.progressDetailItem}>
                                        <MaterialCommunityIcons name="ruler" size={20} color="#9C27B0"/>
                                        <Text style={styles.progressDetailText}>
                                            {sharedHabit.progressComputation.dailyReachableValue} {sharedHabit.progressComputation.unit}
                                        </Text>
                                    </View>
                                )}
                            </View>

                        </View>
                    </View>
                )
                : (
                    <HabitConfig ref={habitConfigRef} habit={getHabitForProgressComputation()}
                                 configType={ConfigType.SHARED_HABIT}
                                 showSaveButton={false}/>
                )}

            {/* Allow editing of all */}
            {(!isEditing || currentUser?.authenticationId === sharedHabit.owner.authenticationId) && (
                <View style={styles.descriptionSection}>
                    <Text style={styles.sectionTitle}>{t('share.allowEditingOfAll')}</Text>
                    <Switch
                        value={allowEditingOfAllUsers}
                        onValueChange={isEditing ? setAllowEditingOfAllUsers : undefined}
                        trackColor={{false: theme.surfaceTertiary, true: theme.primaryLight}}
                        thumbColor={isEditing ? theme.primary : theme.textTertiary}>
                    </Switch>
                </View>
            )}

            {/* Participants Section */}
            <View style={styles.participantsSection}>
                <Text style={styles.sectionTitle}>{t('share.participantsCount', {count: sharedHabit.habits.length})}</Text>
                <SharedHabitParticipants sharedHabit={sharedHabit} currentUser={currentUser}/>
            </View>

            {/* Action Buttons for owner/editors */}
            {canEdit() && (
                <View style={styles.actionsSection}>
                    {isEditing ? (
                        <View style={styles.editingActions}>
                            <TouchableOpacity style={styles.saveButton} onPress={handleSaveEdit}>
                                <MaterialCommunityIcons name="check" size={20} color="#FFFFFF"/>
                                <Text style={styles.buttonText}>{t('common.save')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => {
                                    setIsEditing(false);
                                    setEditedTitle(sharedHabit.title);
                                    setEditedDescription(sharedHabit.description || '');
                                }}
                            >
                                <MaterialCommunityIcons name="close" size={20} color="#666"/>
                                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.secondaryButtons}>
                            <TouchableOpacity style={styles.secondaryButton} onPress={() => setIsEditing(true)}>
                                <MaterialCommunityIcons name="pencil" size={20} color="#2196F3"/>
                                <Text style={styles.secondaryButtonText}>{t('common.edit')}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}

            {renderJoinModal()}
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
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.surfaceSecondary,
    },
    errorText: {
        fontSize: 18,
        color: theme.text,
        textAlign: 'center',
    },
    header: {
        backgroundColor: theme.background,
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    habitIcon: {
        marginRight: 15,
    },
    headerText: {
        flex: 1,
    },
    habitName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 5,
    },
    ownerName: {
        fontSize: 16,
        color: theme.textSecondary,
        marginBottom: 3,
    },
    titleInput: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
        paddingBottom: 5,
    },
    descriptionSection: {
        backgroundColor: theme.surface,
        marginVertical: 10,
        marginHorizontal: 20,
        padding: 20,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 15,
    },
    descriptionText: {
        fontSize: 16,
        color: theme.text,
        lineHeight: 24,
    },
    descriptionInput: {
        fontSize: 16,
        color: theme.text,
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 8,
        padding: 10,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    progressSection: {
        marginHorizontal: 20,
        marginVertical: 10,
    },
    progressCard: {
        backgroundColor: theme.surface,
        padding: 20,
        borderRadius: 10,
        shadowColor: theme.shadow,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    progressDetails: {
        marginTop: 10,
    },
    progressDetailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    progressDetailText: {
        fontSize: 16,
        color: theme.text,
        marginLeft: 10,
    },
    participantsSection: {
        backgroundColor: theme.surface,
        margin: 15,
        padding: 20,
        borderRadius: 10,
        shadowColor: theme.shadow,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    joinSection: {
        margin: 15,
    },
    joinButton: {
        backgroundColor: '#2196F3',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        borderRadius: 10,
        shadowColor: theme.shadow,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    joinButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 10,
    },
    actionsSection: {
        margin: 15,
        marginBottom: 30,
    },
    editingActions: {
        flexDirection: 'row',
        gap: 10,
    },
    saveButton: {
        backgroundColor: '#4CAF50',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        flex: 1,
    },
    cancelButton: {
        backgroundColor: '#F5F5F5',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        flex: 1,
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 5,
    },
    secondaryButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    secondaryButton: {
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        flex: 1,
    },
    deleteButton: {
        borderColor: '#F44336',
    },
    secondaryButtonText: {
        color: '#2196F3',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 5,
    },
    buttonText: {
        color: theme.text,
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 5,
    },
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modalContent: {
        backgroundColor: theme.surfaceSecondary,
        margin: 20,
        padding: 20,
        borderRadius: 10,
        width: width - 40,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 10,
        textAlign: 'center',
    },
    modalDescription: {
        fontSize: 16,
        color: theme.textSecondary,
        textAlign: 'center',
        marginBottom: 20,
    },
    modalButton: {
        backgroundColor: theme.surfaceTertiary,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
    },
    modalButtonText: {
        fontSize: 16,
        color: theme.text,
        marginLeft: 10,
        fontWeight: '500',
    },
    modalSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text,
        marginTop: 20,
        marginBottom: 10,
    },
    existingHabitOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 8,
        marginBottom: 8,
    },
    habitColorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 12,
    },
    existingHabitName: {
        fontSize: 16,
        color: theme.text,
    },
    modalCancelButton: {
        backgroundColor: '#F44336',
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 20,
    },
    modalCancelButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    copyLinkSection: {
        backgroundColor: theme.surface,
        marginHorizontal: 20,
        marginVertical: 10,
        padding: 20,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    copyLinkButton: {
        backgroundColor: '#2196F3',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 10,
        shadowColor: theme.shadow,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        flex: 1,
    },
    copyLinkButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 10,
    },
}));

export default SharedHabitDetailsScreen;
