import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, Dimensions, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {
    ApiAccountRead,
    ApiComputationReadWrite,
    ApiHabitRead,
    ApiHabitRecordRead,
    ApiSharedHabitMedalsRead,
    ApiSharedHabitRead,
    habitApi,
    habitRecordApi,
    sharedHabitApi
} from '@/services/api';
import {MaterialCommunityIcons} from "@expo/vector-icons";
import ProgressRing from "@/components/ProgressRing";
import {useFocusEffect, useLocalSearchParams, useRouter} from "expo-router";
import alert from "@/services/alert";
import NumberModal from "@/components/NumberModal";
import SharedHabitParticipants from "@/components/SharedHabitParticipants";
import * as Clipboard from "expo-clipboard";
import ActivityCalendar from "@/components/ActivityCalendar";
import {AuthService} from "@/services/auth";
import {useTheme} from "@/context/ThemeContext";
import {createThemedStyles} from "@/constants/styles";
import {UI_BASE_URL} from "@/public/config";

const {width} = Dimensions.get('window');

const HabitDetailsScreen = () => {
    const {theme} = useTheme();
    const styles = createStyles(theme);

    const router = useRouter();
    const habitUuid = useLocalSearchParams()['habitUuid'] as string;
    const isOwnHabit = useLocalSearchParams()['isOwnHabit'] as string;

    const [habitDetail, setHabitDetail] = useState<ApiHabitRead>();
    const [loading, setLoading] = useState(true);

    const [sharedHabits, setSharedHabits] = useState<ApiSharedHabitRead[]>([]);
    const [medals, setMedals] = useState<ApiSharedHabitMedalsRead[]>([]);
    const [showShareModal, setShowShareModal] = useState(false);

    const [numberModalVisible, setModalVisible] = useState(false);
    const [selectedEpochDay, setSelectedEpochDay] = useState<number | null>(null);

    const [lastValueUpdate, setLastValueUpdate] = useState(Date.now());

    const [currentUser, setCurrentUser] = useState<ApiAccountRead | null>(null);

    useEffect(() => {
        const getCurrentUser = async () => {
            try {
                const user = await AuthService.getInstance().getCurrentUser();
                console.log("current user", user);
                setCurrentUser(user);
            } catch (error) {
                console.error('Error fetching current user:', error);
            }
        };
        getCurrentUser();
    }, []);

    const isChallenge = habitDetail?.isChallengeHabit || habitDetail?.progressComputation?.challengeComputationType;

    const isNonNummericHabit = habitDetail?.progressComputation?.dailyReachableValue === 1
        && habitDetail.progressComputation.dailyGoal === 1;

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [habitUuid])
    );

    const fetchData = async () => {
        try {
            const habitData = await habitApi.getHabitByUuid(habitUuid);
            setHabitDetail(habitData);
            const allSharedHabits = await sharedHabitApi.getAllUserSharedHabits();
            const filteredSharedHabits = allSharedHabits.filter(sh => sh.habits.map(h => h.uuid).includes(habitUuid));
            setSharedHabits(filteredSharedHabits);

            if (filteredSharedHabits.length > 0) {
                try {
                    const medalsData = await sharedHabitApi.getMedalsForSharedHabit(filteredSharedHabits[0].shareCode);
                    setMedals(medalsData);
                } catch (error) {
                    console.error('Error fetching medals:', error);
                }
            }

        } catch (error) {
            console.error('Error fetching habit details:', error);
            alert('Error', 'Failed to load habit details');
        } finally {
            setLoading(false);
        }
    };

    const formatFrequency = (progressComputation: ApiComputationReadWrite) => {
        const {frequencyType, frequency, timesPerXDays} = progressComputation;

        if (frequencyType === 'WEEKLY') {
            return `${frequency} times per week`;
        } else if (frequencyType === 'MONTHLY') {
            return `${frequency} times per month`;
        } else if (frequencyType === 'X_TIMES_PER_Y_DAYS') {
            return `${frequency} times per ${timesPerXDays} days`;
        }
        return 'Custom frequency';
    };

    const handleShareHabit = async () => {
        if (sharedHabits.length > 0) {
            setShowShareModal(true);
        } else {
            await createNewSharedHabit();
        }
    };

    const createNewSharedHabit = async () => {
        try {
            const response = await sharedHabitApi.createSharedHabit({
                habitUuid: habitUuid,
                title: habitDetail?.name,
                progressComputation: habitDetail?.progressComputation,
            });

            router.push(`/share/${response.shareCode}`);
        } catch (error) {
            console.error('Error sharing habit:', error);
            alert('Error', 'Failed to share habit');
        }
    };

    const handleCopyShareCode = async (sharedHabit: ApiSharedHabitRead) => {
        await Clipboard.setStringAsync(`${UI_BASE_URL}/share/${sharedHabit.shareCode}`);
    };

    const handleShareAgain = () => {
        setShowShareModal(false);
        createNewSharedHabit();
    };

    const handleCancel = () => {
        setShowShareModal(false);
    };

    const ShareHabitModal = () => (
        <Modal
            visible={showShareModal}
            transparent={true}
            animationType="fade"
            onRequestClose={handleCancel}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Habit already shared</Text>
                    <Text style={styles.modalMessage}>
                        This habit has already been shared. Copy the share code to let others join the shared habit.
                    </Text>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.button, styles.primaryButton]}
                            onPress={() => handleCopyShareCode(sharedHabits[0])}
                        >
                            <Text style={styles.primaryButtonText}>Copy share code</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={handleCancel}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    const handleDeleteHabit = () => {
        alert(
            'Delete Habit',
            'Are you sure you want to delete this habit? This action cannot be undone.',
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
                            await habitApi.deleteHabit(habitDetail.uuid);
                            router.push(`/habits/`);
                        } catch (error) {
                            console.error('Error deleting habit:', error);
                            alert('Error', 'Failed to delete habit');
                        }
                    }
                }
            ]
        );
    };

    const handleLeaveSharedHabit = () => {
        alert(
            'Leave Shared Habit',
            'Are you sure you want to unlink your habit from the shared habit? You will no longer share progress with other participants.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Leave',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await sharedHabitApi.leaveSharedHabit(sharedHabits[0].shareCode, habitUuid);
                            await fetchData();
                        } catch (error) {
                            console.error('Error leaving shared habit:', error);
                            alert('Error', 'Failed to leave shared habit');
                        }
                    }
                }
            ]
        );
    };

    const handleNumberModalSubmit = async (value: number) => {
        setModalVisible(false);
        if (selectedEpochDay) {
            await habitRecordApi.createRecord(habitUuid, {epochDay: selectedEpochDay, recordValue: value})
            setLastValueUpdate(Date.now());
        }
    }

    const handleClickOnCalendarItem = async (record?: ApiHabitRecordRead, longClick?: boolean) => {
        if (isNonNummericHabit && !longClick && !isChallenge) {
            const value = record ? (record.recordValue === 1 ? 0 : 1) : 1;
            await habitRecordApi.createRecord(habitUuid, {epochDay: record!.epochDay, recordValue: value})
            setLastValueUpdate(Date.now());
        } else {
            setModalVisible(true);
            if (record) {
                setSelectedEpochDay(record.epochDay);
            }
        }
    }

    const handleLongClickOnCalendarItem = async (record?: ApiHabitRecordRead) => {
        console.log("long click on record", record);
        await handleClickOnCalendarItem(record, true);
    }

    const handleEditHabit = () => {
        router.push(`/habit/edit/${habitUuid}`);
    }

    const handleEditSharedHabit = () => {
        router.push(`/share/${sharedHabits[0].shareCode}?edit=true`);
    }

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2196F3"/>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerText}>
                    <Text style={styles.habitName}>{habitDetail?.name}</Text>
                    <Text style={styles.ownerName}>by {habitDetail?.account?.displayName}</Text>
                    {isChallenge && (
                        <View style={styles.challengeBadge}>
                            <MaterialCommunityIcons name="trophy" size={16} color="#FFD700"/>
                            <Text style={styles.challengeText}>Challenge</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Progress Section */}
            {!isChallenge && (
                <View style={styles.progressSection}>
                    <View style={styles.progressCard}>
                        <Text style={styles.sectionTitle}>Progress Overview</Text>

                        <View style={styles.progressContent}>
                            <View style={styles.progressRingContainer}>
                                <ProgressRing
                                    size={120}
                                    percentage={habitDetail?.currentPercentage || 0}
                                    strokeWidth={12}
                                />
                            </View>

                            <View style={styles.progressDetails}>
                                <View style={styles.progressDetailItem}>
                                    <MaterialCommunityIcons name="target" size={20} color="#2196F3"/>
                                    <Text style={styles.progressDetailText}>
                                        {habitDetail?.progressComputation?.targetDays} days target
                                    </Text>
                                </View>

                                <View style={styles.progressDetailItem}>
                                    <MaterialCommunityIcons name="calendar-clock" size={20} color="#FF9800"/>
                                    <Text style={styles.progressDetailText}>
                                        {formatFrequency(habitDetail?.progressComputation)}
                                    </Text>
                                </View>

                                <View style={styles.progressDetailItem}>
                                    <MaterialCommunityIcons name="ruler" size={20} color="#9C27B0"/>
                                    <Text style={styles.progressDetailText}>
                                        Daily
                                        goal: {habitDetail?.progressComputation?.dailyReachableValue} {habitDetail?.progressComputation?.unit || ''}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            )}

            <ActivityCalendar key={lastValueUpdate} handleClickOnCalendarItem={handleClickOnCalendarItem}
                              handleLongClickOnCalendarItem={handleLongClickOnCalendarItem}
                              habit={habitDetail} isBooleanHabit={isNonNummericHabit && !isChallenge}/>

            {habitUuid && isOwnHabit === "true" && (
                <NumberModal
                    visible={numberModalVisible}
                    onClose={() => setModalVisible(false)}
                    onSubmit={handleNumberModalSubmit}
                    habit={habitDetail}
                    showStopwatch={false}
                />
            )}

            {(!isChallenge && sharedHabits.length > 0) && (
                <View style={styles.progressSection}>
                    <View style={styles.progressCard}>
                        <Text style={styles.sectionTitle}>Shared Habits</Text>
                        {sharedHabits.map(sharedHabit => (
                            <React.Fragment key={sharedHabit.shareCode}>
                                <Text style={{fontSize: 16, color: theme.textSecondary}}>{sharedHabit.title}</Text>
                                <Text>{sharedHabit.description}</Text>
                                <SharedHabitParticipants
                                    sharedHabit={sharedHabit}
                                    hideHabit={habitDetail}
                                    medals={medals}
                                />
                            </React.Fragment>
                        ))}
                    </View>
                </View>
            )}

            {/* Action Buttons */}
            {isOwnHabit === "true" && !isChallenge && (
                <View style={styles.actionsSection}>
                    <TouchableOpacity style={styles.primaryButton} onPress={handleShareHabit}>
                        <MaterialCommunityIcons name="share-variant" size={20} color="#FFFFFF"/>
                        <Text style={styles.buttonText}>Share Habit</Text>
                    </TouchableOpacity>

                    {sharedHabits.length > 0 && (
                        <TouchableOpacity style={[styles.primaryButton, styles.leaveSharedButton]}
                                          onPress={handleLeaveSharedHabit}>
                            <MaterialCommunityIcons name="exit-to-app" size={20} color="#FFFFFF"/>
                            <Text style={styles.buttonText}>Leave Shared Habit</Text>
                        </TouchableOpacity>
                    )}

                    <View style={styles.secondaryButtons}>
                        <TouchableOpacity style={styles.secondaryButton} onPress={handleEditHabit}>
                            <MaterialCommunityIcons name="pencil" size={20} color="#2196F3"/>
                            <Text style={styles.secondaryButtonText}>Edit</Text>
                        </TouchableOpacity>
                        {sharedHabits.length > 0 && (sharedHabits[0].allowEditingOfAllUsers || (currentUser &&
                            (sharedHabits.map(sh => sh.owner.authenticationId)
                                .includes(currentUser.authenticationId)))) && (
                            <TouchableOpacity style={[styles.secondaryButton]} onPress={handleEditSharedHabit}>
                                <MaterialCommunityIcons name="pencil" size={20} color="#FF9800"/>
                                <Text style={[styles.secondaryButtonText, {color: "#FF9800"}]}>Edit for all</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <TouchableOpacity style={[styles.secondaryButton, styles.deleteButton]}
                                      onPress={handleDeleteHabit}>
                        <MaterialCommunityIcons name="delete" size={20} color="#F44336"/>
                        <Text style={[styles.secondaryButtonText, {color: '#F44336'}]}>Delete</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Modals */}
            <ShareHabitModal/>
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

    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 13,
        marginTop: 16,
        paddingLeft: 16,
    },

    habitName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 4,
    },
    ownerName: {
        fontSize: 16,
        color: theme.text,
        marginBottom: 8,
    },
    challengeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 215, 0, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    challengeText: {
        color: '#FFD700',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    progressSection: {
        padding: 20,
    },
    progressCard: {
        backgroundColor: theme.surfaceSecondary,
        borderRadius: 16,
        padding: 20,
        shadowColor: theme.shadow,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    progressContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
    },
    progressRingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 24,
        position: 'relative',
    },
    progressPercentage: {
        position: 'absolute',
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    progressDetails: {
        flex: 1,
    },
    progressDetailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    progressDetailText: {
        fontSize: 14,
        color: theme.text,
        marginLeft: 8,
    },
    calendarSection: {
        backgroundColor: theme.background,
        margin: 20,
        borderRadius: 16,
        padding: 20,
        shadowColor: theme.shadow,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    calendarContainer: {
        marginTop: 16,
    },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    monthButton: {
        padding: 8,
    },
    monthTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.text,
    },
    weekDaysHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    weekDayText: {
        fontSize: 12,
        color: theme.text,
        fontWeight: '500',
        width: (width - 80) / 7,
        textAlign: 'center',
    },
    weekRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    dayContainer: {
        alignItems: 'center',
        width: (width - 80) / 7,
    },
    daySquare: {
        width: 32,
        height: 32,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 2,
    },
    dayText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    dayValue: {
        fontSize: 8,
        color: theme.textSecondary,
    },
    legendContainer: {
        marginTop: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: theme.border,
    },
    legendTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 8,
    },
    legendItems: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    legendSquare: {
        width: 12,
        height: 12,
        borderRadius: 2,
        marginRight: 6,
    },
    legendText: {
        fontSize: 12,
        color: theme.textSecondary,
    },
    connectedSection: {
        backgroundColor: theme.background,
        margin: 20,
        borderRadius: 16,
        padding: 20,
        shadowColor: theme.shadow,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    connectedList: {
        marginTop: 16,
    },
    connectedItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    connectedContent: {
        flex: 1,
        marginLeft: 12,
    },
    connectedName: {
        fontSize: 16,
        fontWeight: '500',
        color: theme.text,
    },
    connectedOwner: {
        fontSize: 12,
        color: theme.textSecondary,
        marginTop: 2,
    },
    connectedProgress: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    actionsSection: {
        padding: 20,
        paddingBottom: 40,
    },
    primaryButton: {
        backgroundColor: theme.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        marginBottom: 12,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    secondaryButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    secondaryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        marginHorizontal: 6,
    },
    secondaryButtonText: {
        color: '#2196F3',
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 6,
    },
    deleteButton: {
        borderColor: '#F44336',
    },
    leaveSharedButton: {
        backgroundColor: '#FF9800',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 4,
    },
    noDataText: {
        fontSize: 14,
        color: theme.text,
        textAlign: 'center',
        fontStyle: 'italic',
        marginTop: 20,
    },
    participantCard: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
        flex: 1
    },
    participantInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    participantColorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 12,
    },
    participantDetails: {
        flex: 1,
    },
    participantName: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text,
    },
    participantHabitName: {
        fontSize: 14,
        color: theme.text,
        marginTop: 2,
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: theme.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: theme.surfaceTertiary,
        borderRadius: 12,
        padding: 20,
        width: '90%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
        color: theme.text,
    },
    modalMessage: {
        fontSize: 16,
        marginBottom: 24,
        textAlign: 'center',
        lineHeight: 22,
        color: theme.textSecondary,
    },
    buttonContainer: {
        gap: 12,
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    cancelButton: {
        backgroundColor: '#F2F2F7',
    },
    cancelButtonText: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '600',
    },
}));

export default HabitDetailsScreen;
