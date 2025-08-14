import React, {useCallback, useRef, useState} from 'react';
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
import {
    ApiAccountRead,
    ApiComputationReadWrite,
    ApiHabitRead,
    ApiHabitWrite,
    ApiSharedHabitRead,
    FrequencyTypeDTO,
    habitApi,
    sharedHabitApi,
    userApi
} from '@/services/api';
import {MaterialCommunityIcons} from "@expo/vector-icons";
import {useFocusEffect, useLocalSearchParams, useRouter} from "expo-router";
import {getColorById} from "@/constants/colors";
import alert from "@/services/alert";
import * as Clipboard from 'expo-clipboard';
import HabitConfig, {ConfigType, HabitConfigRef} from "@/components/HabitConfig";
import SharedHabitParticipants from "@/components/SharedHabitParticipants";
import {useTheme} from "@/context/ThemeContext";
import {createThemedStyles} from "@/constants/styles";
import {UI_BASE_URL} from "@/public/config";

const {width} = Dimensions.get('window');

const SharedHabitDetailsScreen = () => {
    const {theme} = useTheme();
    const styles = createStyles(theme);

    const router = useRouter();
    const shareCode = useLocalSearchParams()['shareCode'] as string;

    const editModeEnabled = useLocalSearchParams()['edit'] === 'true';

    const [sharedHabit, setSharedHabit] = useState<ApiSharedHabitRead>();
    const [progressComputation, setProgressComputation] = useState<ApiComputationReadWrite>();
    const [currentUser, setCurrentUser] = useState<ApiAccountRead>();
    const [userHabits, setUserHabits] = useState<ApiHabitRead[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(editModeEnabled);
    const [editedTitle, setEditedTitle] = useState('');
    const [editedDescription, setEditedDescription] = useState('');
    const [allowEditingOfAllUsers, setAllowEditingOfAllUsers] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);

    const habitConfigRef = useRef<HabitConfigRef>(null);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [shareCode])
    );

    const updateProgressComputation = (habit: ApiHabitWrite) => {
        setProgressComputation(habit.progressComputation);
    }

    const getHabitForProgressComputation = (): ApiHabitRead => {
        return {
            account: {displayName: "", authenticationId: "", email: ""},
            color: 0,
            currentPercentage: 0,
            name: "",
            uuid: "",
            progressComputation: progressComputation!
        }
    }

    const fetchData = async () => {
        try {
            const [sharedHabitData, userData, habitsData] = await Promise.all([
                sharedHabitApi.getSharedHabitByShareCode(shareCode),
                userApi.getUserInfo(),
                habitApi.getUserHabits()
            ]);

            setSharedHabit(sharedHabitData);
            setProgressComputation(sharedHabitData.progressComputation);
            setCurrentUser(userData);
            setUserHabits(habitsData);
            setEditedTitle(sharedHabitData.title);
            setEditedDescription(sharedHabitData.description || '');
            setAllowEditingOfAllUsers(sharedHabitData.allowEditingOfAllUsers);
        } catch (error) {
            console.error('Error fetching shared habit details:', error);
            alert('Error', 'Failed to load shared habit details');
        } finally {
            setLoading(false);
        }
    };

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

            const updatedSharedHabit = await sharedHabitApi.updateSharedHabit({
                title: editedTitle,
                habitUuid: sharedHabit.habits.find(h => h.account.authenticationId === sharedHabit.owner.authenticationId)?.uuid,
                description: editedDescription,
                allowEditingOfAllUsers: allowEditingOfAllUsers,
                progressComputation: updatedHabitData.progressComputation
            }, shareCode);

            setSharedHabit(updatedSharedHabit);
            setProgressComputation(updatedHabitData.progressComputation);
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating shared habit:', error);
            alert('Error', 'Failed to update shared habit');
        }
    };

    const handleJoinWithNewHabit = async () => {
        try {
            await sharedHabitApi.joinSharedHabit(shareCode);
            setShowJoinModal(false);
            fetchData(); // Refresh data
            alert('Success', 'Successfully joined with new habit!');
        } catch (error) {
            console.error('Error joining with new habit:', error);
            alert('Error', 'Failed to join shared habit');
        }
    };

    const handleJoinWithExistingHabit = (habitUuid: string) => {
        alert(
            'Join with Existing Habit',
            'Are you sure you want to connect this existing habit to the shared habit?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Join',
                    onPress: async () => {
                        try {
                            await sharedHabitApi.joinSharedHabit(shareCode, habitUuid);
                            setShowJoinModal(false);
                            fetchData(); // Refresh data
                            alert('Success', 'Successfully joined with existing habit!');
                        } catch (error) {
                            console.error('Error joining with existing habit:', error);
                            alert('Error', 'Failed to join shared habit');
                        }
                    }
                }
            ]
        );
    };

    const handleDeleteSharedHabit = () => {
        if (!sharedHabit) return;

        alert(
            'Delete Shared Habit',
            'Are you sure you want to delete this shared habit? This action cannot be undone.',
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
                            await sharedHabitApi.deleteSharedHabit({
                                title: sharedHabit.title,
                                habitUuid: sharedHabit.habits.find(h => h.account.authenticationId === sharedHabit.owner.authenticationId)?.uuid,
                                description: sharedHabit.description,
                                allowEditingOfAllUsers: sharedHabit.allowEditingOfAllUsers,
                                progressComputation: progressComputation!
                            }, shareCode);
                            router.push('/habits');
                        } catch (error) {
                            console.error('Error deleting shared habit:', error);
                            alert('Error', 'Failed to delete shared habit');
                        }
                    }
                }
            ]
        );
    };

    const formatFrequency = (progressComputation: ApiComputationReadWrite) => {
        const {frequencyType, frequency, timesPerXDays} = progressComputation;

        if (frequencyType === FrequencyTypeDTO.WEEKLY) {
            return `${frequency} times per week`;
        } else if (frequencyType === FrequencyTypeDTO.MONTHLY) {
            return `${frequency} times per month`;
        } else if (frequencyType === FrequencyTypeDTO.X_TIMES_PER_Y_DAYS) {
            return `${frequency} times per ${timesPerXDays} days`;
        }
        return 'Custom frequency';
    };

    const renderJoinModal = () => {
        if (!showJoinModal) return null;

        return (
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Join Shared Habit</Text>
                    <Text style={styles.modalDescription}>
                        How would you like to join this shared habit?
                    </Text>

                    <TouchableOpacity
                        style={styles.modalButton}
                        onPress={handleJoinWithNewHabit}
                    >
                        <MaterialCommunityIcons name="plus-circle" size={24} color="#2196F3"/>
                        <Text style={styles.modalButtonText}>Create New Habit</Text>
                    </TouchableOpacity>

                    {userHabits.length > 0 && (
                        <>
                            <Text style={styles.modalSectionTitle}>Or connect an existing habit:</Text>
                            {userHabits.map(habit => (
                                <TouchableOpacity
                                    key={habit.uuid}
                                    style={styles.existingHabitOption}
                                    onPress={() => handleJoinWithExistingHabit(habit.uuid)}
                                >
                                    <View
                                        style={[styles.habitColorDot, {backgroundColor: getColorById(habit.color) || '#E0E0E0'}]}/>
                                    <Text style={styles.existingHabitName}>{habit.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </>
                    )}

                    <TouchableOpacity
                        style={styles.modalCancelButton}
                        onPress={() => setShowJoinModal(false)}
                    >
                        <Text style={styles.modalCancelButtonText}>Cancel</Text>
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

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2196F3"/>
            </View>
        );
    }

    if (!sharedHabit) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Shared habit not found</Text>
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
                                placeholder="Habit title"
                            />
                        ) : (
                            <Text style={styles.habitName}>{sharedHabit.title}</Text>
                        )}
                        <Text style={styles.ownerName}>by {sharedHabit.owner.displayName}</Text>
                    </View>
                </View>
            </View>

            {/* Copy Link Button */}
            <View style={styles.copyLinkSection}>
                <TouchableOpacity
                    style={styles.copyLinkButton}
                    onPress={handleCopy}
                >
                    <MaterialCommunityIcons name="content-copy" size={24} color="#FFFFFF"/>
                    <Text style={styles.copyLinkButtonText}>Copy Link to Share</Text>
                </TouchableOpacity>
            </View>

            {/* Description */}
            <View style={styles.descriptionSection}>
                <Text style={styles.sectionTitle}>Description</Text>
                {isEditing ? (
                    <TextInput
                        style={styles.descriptionInput}
                        value={editedDescription}
                        onChangeText={setEditedDescription}
                        placeholder="Add a description..."
                        multiline
                    />
                ) : (
                    <Text style={styles.descriptionText}>
                        {sharedHabit.description || 'No description provided'}
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
                        <Text style={styles.joinButtonText}>Join This Habit</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Progress Section */}
            {!isEditing ? (
                    <View style={styles.progressSection}>
                        <View style={styles.progressCard}>
                            <Text style={styles.sectionTitle}>Progress Details</Text>


                            <View style={styles.progressDetails}>
                                <View style={styles.progressDetailItem}>
                                    <MaterialCommunityIcons name="target" size={20} color="#2196F3"/>
                                    <Text style={styles.progressDetailText}>
                                        {progressComputation?.targetDays} days target
                                    </Text>
                                </View>

                                <View style={styles.progressDetailItem}>
                                    <MaterialCommunityIcons name="calendar-clock" size={20} color="#FF9800"/>
                                    <Text style={styles.progressDetailText}>
                                        {formatFrequency(progressComputation!)}
                                    </Text>
                                </View>

                                <View style={styles.progressDetailItem}>
                                    <MaterialCommunityIcons name="flag" size={20} color="#4CAF50"/>
                                    <Text style={styles.progressDetailText}>
                                        {progressComputation?.dailyGoal} daily goal
                                    </Text>
                                </View>

                                {progressComputation?.unit && (
                                    <View style={styles.progressDetailItem}>
                                        <MaterialCommunityIcons name="ruler" size={20} color="#9C27B0"/>
                                        <Text style={styles.progressDetailText}>
                                            {progressComputation.dailyReachableValue} {progressComputation.unit}
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
            <View style={styles.descriptionSection}>
                <Text style={styles.sectionTitle}>Allow editing of all participants</Text>
                <Switch
                    value={allowEditingOfAllUsers}
                    onValueChange={isEditing ? setAllowEditingOfAllUsers : undefined}>
                </Switch>
            </View>

            {/* Participants Section */}
            <View style={styles.participantsSection}>
                <Text style={styles.sectionTitle}>Participants ({sharedHabit.habits.length})</Text>
                <SharedHabitParticipants sharedHabit={sharedHabit} currentUser={currentUser}/>
            </View>

            {/* Action Buttons for owner/editors */}
            {canEdit() && (
                <View style={styles.actionsSection}>
                    {isEditing ? (
                        <View style={styles.editingActions}>
                            <TouchableOpacity style={styles.saveButton} onPress={handleSaveEdit}>
                                <MaterialCommunityIcons name="check" size={20} color="#FFFFFF"/>
                                <Text style={styles.buttonText}>Save</Text>
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
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.secondaryButtons}>
                            <TouchableOpacity style={styles.secondaryButton} onPress={() => setIsEditing(true)}>
                                <MaterialCommunityIcons name="pencil" size={20} color="#2196F3"/>
                                <Text style={styles.secondaryButtonText}>Edit</Text>
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
        backgroundColor: theme.surfaceSecondary,
        margin: 15,
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
        color: theme.textSecondary,
        lineHeight: 24,
    },
    descriptionInput: {
        fontSize: 16,
        color: theme.textSecondary,
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 8,
        padding: 10,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    progressSection: {
        marginHorizontal: 15,
        marginBottom: 15,
    },
    progressCard: {
        backgroundColor: theme.surfaceSecondary,
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
        backgroundColor: theme.surfaceSecondary,
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
        color: '#FFFFFF',
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
        backgroundColor: '#FFFFFF',
        margin: 20,
        padding: 20,
        borderRadius: 10,
        width: width - 40,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
        textAlign: 'center',
    },
    modalDescription: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    modalButton: {
        backgroundColor: '#F5F5F5',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
    },
    modalButtonText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 10,
        fontWeight: '500',
    },
    modalSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
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
        backgroundColor: theme.surfaceSecondary,
        margin: 15,
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
