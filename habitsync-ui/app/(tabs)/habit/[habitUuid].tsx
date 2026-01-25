import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, Dimensions, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {
    ApiAccountRead,
    ApiComputationReadWrite,
    ApiHabitRecordRead,
    ApiSharedHabitMedalsRead,
    ApiSharedHabitRead,
    FrequencyTypeDTO,
    NotificationConfig as NotificationConfigType,
    sharedHabitApi
} from '@/services/api';
import {MaterialCommunityIcons} from "@expo/vector-icons";
import ProgressRing from "@/components/ProgressRing";
import {useFocusEffect, useLocalSearchParams, useRouter} from "expo-router";
import alert from "@/services/alert";
import NumberModal from "@/components/NumberModal";
import SharedHabitParticipants from "@/components/SharedHabitParticipants";
import ActivityCalendar from "@/components/ActivityCalendar";
import {AuthService} from "@/services/auth";
import {useTheme} from "@/context/ThemeContext";
import {createThemedStyles} from "@/constants/styles";
import NotificationConfigComponent from "@/components/NotificationConfig";
import ShareHabitModal from "@/components/ShareHabitModal";
import {habitKeys, useCreateHabitRecord, useDeleteHabit, useHabit} from "@/hooks/useHabits";
import {useLeaveSharedHabit, useSharedHabits} from "@/hooks/useSharedHabits";
import {queryClient} from "@/context/ReactQueryContext";

const UI_BASE_URL = process.env.EXPO_PUBLIC_UI_BASE_URL || 'http://localhost:8081';

const {width} = Dimensions.get('window');

const HabitDetailsScreen = () => {
    const {theme} = useTheme();
    const styles = createStyles(theme);

    const router = useRouter();
    const habitUuid = useLocalSearchParams()['habitUuid'] as string;
    const [isOwnHabit, setIsOwnHabit] = useState<boolean>(false);

    const leaveSharedHabitMutation = useLeaveSharedHabit();

    const {data: habitDetail, isLoading: loading, refetch} = useHabit(habitUuid);
    const deleteHabitMutation = useDeleteHabit();
    const createHabitRecordMutation = useCreateHabitRecord();
    const {data: allSharedHabits = []} = useSharedHabits();

    const [sharedHabits, setSharedHabits] = useState<ApiSharedHabitRead[]>([]);
    const [medals, setMedals] = useState<ApiSharedHabitMedalsRead[]>([]);
    const [showShareModal, setShowShareModal] = useState(false);

    const [numberModalVisible, setModalVisible] = useState(false);
    const [selectedEpochDay, setSelectedEpochDay] = useState<number | null>(null);

    const [currentUser, setCurrentUser] = useState<ApiAccountRead | null>(null);

    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

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

    useEffect(() => {
        if (habitDetail) {
            setNotificationsEnabled((habitDetail.notificationFrequency !== null)
                && (habitDetail.notificationFrequency.rules !== null) &&
                habitDetail.notificationFrequency.rules.length > 0);
        }
    }, [habitDetail]);

    useEffect(() => {
        if (currentUser && habitDetail) {
            setIsOwnHabit(currentUser.authenticationId === habitDetail.account?.authenticationId);
        }
    }, [currentUser, habitDetail]);

    useEffect(() => {
        if (allSharedHabits) {
            const filteredSharedHabits = allSharedHabits.filter(sh => sh.habits.map(h => h.uuid).includes(habitUuid));
            setSharedHabits(filteredSharedHabits);

            if (filteredSharedHabits.length > 0) {
                const fetchMedals = async () => {
                    try {
                        const medalsData = await sharedHabitApi.getMedalsForSharedHabit(filteredSharedHabits[0].shareCode);
                        setMedals(medalsData);
                    } catch (error) {
                        console.error('Error fetching medals:', error);
                    }
                };
                fetchMedals();
            }
        }
    }, [allSharedHabits, habitUuid]);

    const isChallenge = habitDetail?.isChallengeHabit || habitDetail?.progressComputation?.challengeComputationType;

    const isNonNummericHabit = habitDetail?.progressComputation?.dailyReachableValue === 1
        && habitDetail.progressComputation.dailyDefault === "1";

    const fetchData = useCallback(async () => {
        try {
            queryClient.invalidateQueries({
                queryKey: habitKeys.records(habitUuid),
            });
            await refetch();
        } catch (error) {
            console.error('Error fetching habit details:', error);
            alert('Error', 'Failed to load habit details');
        }
    }, [habitUuid, refetch]);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

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

    const isCustomFrequency = (progressComputation: ApiComputationReadWrite) => {
        console.log(progressComputation.frequencyType, progressComputation.frequency, progressComputation.timesPerXDays);
        return progressComputation.frequencyType === FrequencyTypeDTO.DAILY
            || ((progressComputation.frequency !== 1 || progressComputation.isNegative) && progressComputation.frequency !== 0 && progressComputation.timesPerXDays !== 1)
            || progressComputation.dailyReachableValue === 1 || (progressComputation.dailyReachableValue === 0 && progressComputation.frequency !== 0);
    }

    const getFrequencyTypeText = (progressComputation: ApiComputationReadWrite) => {
        return getFrequencyTypeTextType(progressComputation) + (progressComputation.isNegative ? " Max" : " Goal");
    }

    const getFrequencyTypeTextType = (progressComputation: ApiComputationReadWrite) => {
        if (progressComputation.frequencyType === FrequencyTypeDTO.DAILY ||
            (progressComputation.frequency === 1 && progressComputation.timesPerXDays === 1) ||
            (progressComputation.frequency !== 0 && progressComputation.isNegative)) {
            return "Daily";
        }
        if (progressComputation.frequencyType === FrequencyTypeDTO.WEEKLY) {
            return "Weekly";
        }
        if (progressComputation.frequencyType === FrequencyTypeDTO.MONTHLY) {
            return "Monthly";
        }
        return "";
    }

    const handleDeleteHabit = () => {
        if (!habitDetail?.uuid) {
            alert('Error', 'Habit details not available');
            return;
        }

        alert(
            'Archive Habit',
            'Are you sure you want to archive this habit?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Archive',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteHabitMutation.mutateAsync(habitDetail!.uuid);
                            router.push(`/(tabs)/habits` as any);
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
                            await leaveSharedHabitMutation.mutateAsync(sharedHabits[0].shareCode);
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
            await createHabitRecordMutation.mutateAsync({
                habitUuid,
                record: {epochDay: selectedEpochDay, recordValue: value},
                isChallenge: habitDetail?.isChallengeHabit || false,
                isDetailView: true
            });
        }
    }

    const handleClickOnCalendarItem = async (record?: ApiHabitRecordRead, longClick?: boolean) => {
        if (isNonNummericHabit && !longClick && !isChallenge) {
            const value = record ? (record.recordValue === 1 ? 0 : 1) : 1;
            await createHabitRecordMutation.mutateAsync({
                habitUuid,
                record: {epochDay: record!.epochDay, recordValue: value},
                isChallenge: habitDetail?.isChallengeHabit || false,
                isDetailView: true
            });
        } else {
            setModalVisible(true);
            if (record) {
                setSelectedEpochDay(record.epochDay);
            }
        }
    }

    const handleLongClickOnCalendarItem = async (record?: ApiHabitRecordRead) => {
        await handleClickOnCalendarItem(record, true);
    }

    const handleEditHabit = () => {
        router.push(`/habit/edit/${habitUuid}`);
    }

    const handleEditSharedHabit = () => {
        router.push(`/share/${sharedHabits[0].shareCode}?edit=true`);
    }

    const handleNotificationPress = () => {
        setShowNotificationModal(true);
    };

    const handleCloseNotificationModal = async (notificationConfig: NotificationConfigType) => {
        setShowNotificationModal(false);
        setNotificationsEnabled(notificationConfig.rules.length > 0);
    }

    const NotificationModal = () => (
        <Modal
            visible={showNotificationModal}
            transparent={false}
            animationType="fade"
        >
            <View style={styles.notificationModalContainer}>
                <NotificationConfigComponent
                    habitUuid={habitDetail!.uuid}
                    currentConfig={habitDetail!.notificationFrequency}
                    onModalClose={handleCloseNotificationModal}
                />
            </View>
        </Modal>
    );

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
                <View style={styles.headerContent}>
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

                    {/* Action Buttons in Header */}
                    {isOwnHabit && !isChallenge && (
                        <View style={styles.headerActions}>
                            <TouchableOpacity
                                style={styles.headerButton}
                                onPress={() => setShowShareModal(true)}
                            >
                                <MaterialCommunityIcons
                                    name="share-variant"
                                    size={24}
                                    color={theme.textSecondary}
                                />
                                {sharedHabits.length > 0 && (
                                    <View style={styles.shareIndicator}/>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.headerButton}
                                onPress={handleNotificationPress}
                            >
                                <MaterialCommunityIcons
                                    name={"bell-outline"}
                                    size={24}
                                    color={theme.textSecondary}
                                />
                                {notificationsEnabled && (
                                    <View style={styles.notificationIndicator}/>
                                )}
                            </TouchableOpacity>
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

                                {habitDetail?.progressComputation && isCustomFrequency(habitDetail.progressComputation) && (
                                    <View style={styles.progressDetailItem}>
                                        <MaterialCommunityIcons name="calendar-clock" size={20} color="#FF9800"/>
                                        <Text style={styles.progressDetailText}>
                                            {habitDetail.progressComputation && formatFrequency(habitDetail.progressComputation)}
                                        </Text>
                                    </View>
                                )}

                                {typeof habitDetail?.progressComputation?.dailyReachableValue === "number" &&
                                    habitDetail?.progressComputation?.dailyReachableValue !== 1 && (
                                    <View style={styles.progressDetailItem}>
                                        <MaterialCommunityIcons name="ruler" size={20} color="#9C27B0"/>
                                        <Text style={styles.progressDetailText}>
                                            {habitDetail.progressComputation && getFrequencyTypeText(habitDetail.progressComputation)}: {habitDetail?.progressComputation?.dailyReachableValue} {habitDetail?.progressComputation?.unit || ''}
                                        </Text>
                                    </View>
                                )}

                                <View style={styles.progressDetailItem}>
                                    <MaterialCommunityIcons name="percent" size={20} color="#2196F3"/>
                                    <Text style={styles.progressDetailText}>
                                        Percentage of last {habitDetail?.progressComputation?.targetDays} days
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            )}

            <ActivityCalendar
                handleClickOnCalendarItem={handleClickOnCalendarItem}
                handleLongClickOnCalendarItem={handleLongClickOnCalendarItem}
                habit={habitDetail!}
                isBooleanHabit={isNonNummericHabit && !isChallenge}
            />

            {habitUuid && isOwnHabit && habitDetail && (
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
                                <Text style={{color: theme.textSecondary}}>{sharedHabit.description}</Text>
                                <SharedHabitParticipants
                                    sharedHabit={sharedHabit}
                                    medals={medals}
                                />
                            </React.Fragment>
                        ))}
                    </View>
                </View>
            )}

            {/* Action Buttons */}
            {isOwnHabit && !isChallenge && (
                <View style={styles.actionsSection}>
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

                    {isOwnHabit && sharedHabits.length > 0 && (
                        <TouchableOpacity style={[styles.secondaryButton, styles.leaveSharedButton]}
                                          onPress={handleLeaveSharedHabit}>
                            <MaterialCommunityIcons name="exit-to-app" size={20} color="#FF9800"/>
                            <Text style={[styles.secondaryButtonText, {color: '#FF9800'}]}>Leave Shared Habit</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity style={[styles.secondaryButton, styles.deleteButton]}
                                      onPress={handleDeleteHabit}>
                        <MaterialCommunityIcons name="delete" size={20} color="#F44336"/>
                        <Text style={[styles.secondaryButtonText, {color: '#F44336'}]}>Archive</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Modals */}
            {habitDetail && (
                <ShareHabitModal
                    visible={showShareModal}
                    onClose={() => setShowShareModal(false)}
                    habitDetail={habitDetail}
                    sharedHabits={sharedHabits}
                    isOwnHabit={currentUser?.authenticationId! === habitDetail.account?.authenticationId}
                    onUpdate={fetchData}
                />
            )}
            <NotificationModal/>
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
        marginBottom: 13,
        marginTop: 42,
        paddingHorizontal: 16,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingRight: 8,
    },
    headerText: {
        flex: 1,
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
        paddingVertical: 5,
        paddingHorizontal: 20,
    },
    progressCard: {
        backgroundColor: theme.surface,
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
        paddingVertical: 5,
        paddingHorizontal: 20,
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
        marginBottom: 12,
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
        padding: 10,
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
    notificationModalContent: {
        backgroundColor: theme.surfaceTertiary,
        borderRadius: 12,
        padding: 20,
        width: '90%',
        maxWidth: 400,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    closeButton: {
        padding: 8,
    },
    modalPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
    },
    placeholderText: {
        fontSize: 16,
        color: theme.text,
        textAlign: 'center',
        marginTop: 8,
    },
    placeholderSubtext: {
        fontSize: 14,
        color: theme.textSecondary,
        textAlign: 'center',
        marginTop: 4,
    },
    notificationButton: {
        padding: 8,
        position: 'relative',
    },
    notificationIndicator: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF9800',
    },
    notificationModalContainer: {
        flex: 1,
        backgroundColor: theme.background,
        paddingTop: 40,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerButton: {
        padding: 8,
        position: 'relative',
        marginLeft: 16,
    },
    shareIndicator: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF9800',
    },
}));

export default HabitDetailsScreen;
