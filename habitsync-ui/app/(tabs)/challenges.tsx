import {
    ApiChallengeOverviewRead,
    ApiChallengeRead,
    ApiComputationReadWrite,
    ApiHabitRead,
    challengeApi,
    ChallengeComputationType,
    ChallengeStatus
} from "@/services/api";
import {MaterialCommunityIcons} from "@expo/vector-icons";
import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Link, useFocusEffect, useRouter} from "expo-router";
import ProgressBar from "@/components/ProgressBar";
import HabitRow from "@/components/HabitRow";
import alert from "@/services/alert";
import {createThemedStyles} from "@/constants/styles";
import {useTheme} from "@/context/ThemeContext";

const ChallengesScreen = () => {
    const {theme} = useTheme();
    const styles = createStyles(theme);

    const router = useRouter();
    const [challengeOverview, setChallengeOverview] = useState<ApiChallengeOverviewRead | null>(null);
    const [votes, setVotes] = useState<Map<number, boolean>>(new Map<number, boolean>);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'active' | 'proposed' | 'created'>('active');
    const [challengeHabit, setChallengeHabit] = useState<ApiHabitRead | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);

        return () => clearInterval(timer);
    }, []);

    const fetchData = useCallback(async () => {
        try {
            const data = await challengeApi.getCurrentChallengeOverview();
            setChallengeOverview(data);
            setVotes(new Map(data.proposedChallenges.filter(c => c.currentUserVote !== null)
                .map(c => [c.id, c.currentUserVote!])));
            setChallengeHabit(await challengeApi.getChallengeHabit());
        } catch (error) {
            console.error('Error fetching challenges:', error);
            alert('Error', 'Failed to load challenges');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

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

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    const handleVote = async (item: ApiChallengeRead, vote: boolean) => {
        try {
            setVotes(new Map(votes.set(item.id, vote)));
            await challengeApi.voteOnChallenge(item.id, vote);
        } catch (error) {
            console.error('Error voting on challenge:', error);
            alert('Error', 'Failed to vote on challenge');
        }
    };

    const handleProposeChallenge = async (id: number) => {
        try {
            await challengeApi.proposeChallenge(id);
            fetchData();
        } catch (error) {
            console.error('Error proposing challenge:', error);
            alert('Error', 'Failed to propose challenge');
        }
    };

    const handleDeleteChallenge = async (id: number) => {
        alert(
            'Delete Challenge',
            'Are you sure you want to delete this challenge?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await challengeApi.deleteChallenge(id);
                            fetchData();
                        } catch (error) {
                            console.error('Error deleting challenge:', error);
                            alert('Error', 'Failed to delete challenge');
                        }
                    },
                },
            ]
        );
    };

    const formatDate = (dateString: number) => {
        const epochTime = dateString * 86400000;
        const date = new Date(epochTime);
        return new Intl.DateTimeFormat('de-DE', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }).format(date);
    };

    const getTimeRemaining = (endDay: number) => {
        const endDate = new Date(endDay * 86400000);
        const diffTime = endDate.getTime() - currentTime.getTime();

        if (diffTime <= 0) {
            return {text: "Challenge ended", isExpired: true};
        }

        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            return {text: "Ends today", isExpired: false, isUrgent: true};
        } else if (diffDays <= 7) {
            return {text: `${diffDays} days left`, isExpired: false, isUrgent: true};
        } else {
            return {text: `${diffDays} days left`, isExpired: false, isUrgent: false};
        }
    };

    const renderChallengeItem = ({item}: { item: ApiChallengeRead }) => {
        const isProposed = item.status === ChallengeStatus.PROPOSED;
        const isActive = item.status === ChallengeStatus.ACTIVE;
        const timeRemaining = isActive ? getTimeRemaining(item.endDay) : null;

        return (
            <View style={styles.challengeCard}>
                <View style={styles.challengeHeader}>
                    <View style={styles.challengeTitleContainer}>
                        <Text style={styles.challengeName}>{item.title}</Text>
                        <View style={styles.statusBadge}>
                            <Text style={styles.statusText}>{item.status}</Text>
                        </View>
                    </View>

                    {timeRemaining && (
                        <View style={[
                            styles.timeRemainingBadge,
                            timeRemaining.isExpired && styles.expiredBadge,
                            timeRemaining.isUrgent && !timeRemaining.isExpired && styles.urgentBadge
                        ]}>
                            <MaterialCommunityIcons
                                name={timeRemaining.isExpired ? "clock-alert" : "clock-outline"}
                                size={14}
                                color={timeRemaining.isExpired ? "#F44336" : timeRemaining.isUrgent ? "#FF9800" : "#666"}
                            />
                            <Text style={[
                                styles.timeRemainingText,
                                timeRemaining.isExpired && styles.expiredText,
                                timeRemaining.isUrgent && !timeRemaining.isExpired && styles.urgentText
                            ]}>
                                {timeRemaining.text}
                            </Text>
                        </View>
                    )}
                </View>

                <Text style={styles.challengeDescription}>{item.description}</Text>

                <View style={styles.goalSection}>
                    <View style={styles.goalHeader}>
                        <MaterialCommunityIcons name="target" size={18} color="#2196F3"/>
                        <Text style={styles.goalTitle}>Goal</Text>
                    </View>

                    <View style={styles.goalDetails}>
                        <View style={styles.goalItem}>
                            <MaterialCommunityIcons name="function" size={16} color="#666"/>
                            <Text style={styles.goalItemText}>
                                {item.computation?.challengeComputationType}
                            </Text>
                        </View>

                        {item.computation.challengeComputationType !== ChallengeComputationType.MAX_VALUE && (
                            <View style={styles.goalItem}>
                                <MaterialCommunityIcons name="calendar-clock" size={16} color="#666"/>
                                <Text style={styles.goalItemText}>
                                    {formatFrequency(item?.computation)}
                                </Text>
                            </View>
                        )}

                        {item.computation?.dailyReachableValue && (
                            <View style={styles.goalItem}>
                                <MaterialCommunityIcons name="ruler" size={16} color="#666"/>
                                <Text style={styles.goalItemText}>
                                    Daily: {item.computation.dailyReachableValue} {item.computation.unit}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {isActive && (
                    <View style={styles.timeRemainingBadge}>
                        <MaterialCommunityIcons name="calendar" size={14} color="#666"/>
                        <Text style={styles.timeRemainingText}>
                            {formatDate(item.startDay)} - {formatDate(item.endDay)}
                        </Text>
                    </View>
                )}

                <View style={styles.challengeFooter}>
                    {isProposed && (
                        <View style={styles.votingSection}>
                            <TouchableOpacity
                                style={[styles.voteButton, votes.get(item.id) === true && styles.activeUpvote]}
                                onPress={() => handleVote(item, true)}
                            >
                                <MaterialCommunityIcons name="thumb-up" size={18}
                                                        color={votes.get(item.id) === true ? "#4CAF50" : theme.textSecondary}/>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.voteButton, votes.get(item.id) === false && styles.activeDownvote]}
                                onPress={() => handleVote(item, false)}
                            >
                                <MaterialCommunityIcons name="thumb-down" size={18}
                                                        color={votes.get(item.id) === false ? "#F44336" : theme.textSecondary}/>
                            </TouchableOpacity>
                        </View>
                    )}

                    {item.status === ChallengeStatus.CREATED && (
                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.proposeButton]}
                                onPress={() => handleProposeChallenge(item.id)}
                            >
                                <Text style={styles.actionButtonText}>Propose</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.actionButton, styles.editButton]}
                                onPress={() => router.push(`/challenge/edit/${item.id}`)}
                            >
                                <Text style={styles.actionButtonText}>Edit</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.actionButton, styles.deleteButton]}
                                onPress={() => handleDeleteChallenge(item.id)}
                            >
                                <Text style={styles.actionButtonText}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {(item.status === ChallengeStatus.PROPOSED && item.account.authenticationId === 'currentUser') && (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.deleteButton]}
                            onPress={() => handleDeleteChallenge(item.id)}
                        >
                            <Text style={styles.actionButtonText}>Delete</Text>
                        </TouchableOpacity>
                    )}
                </View>

            </View>
        );
    };

    // Move renderFooter function outside of renderTabContent and memoize it with useCallback
    const renderFooter = useCallback(() => {
        if (activeTab === 'active' && challengeHabit && challengeOverview) {
            return (
                <>
                    <HabitRow
                        key={challengeHabit.uuid}
                        habit={challengeHabit}
                        isExpanded={false}
                        onToggleExpand={() => {
                        }}
                        onUpdate={() => fetchData()}
                        connectedHabits={[]}
                        isConnectedHabitView={false}
                        isChallengeHabit={true}
                    />
                    <View style={styles.participantsSection}>
                        <Text style={styles.sectionTitle}>Challenge Progress
                            ({challengeOverview.progressCurrentChallengeUsers.length})</Text>
                        {challengeOverview.progressCurrentChallengeUsers.map(challengeProgress => (

                            <View key={challengeProgress.account.authenticationId} style={styles.participantCard}>

                                <View style={styles.participantInfo}>
                                    <View style={styles.participantDetails}>
                                        <Link href={{
                                            pathname: challengeProgress.linkToHabit,
                                        }}>
                                            <Pressable>
                                                <Text
                                                    style={styles.participantName}>{challengeProgress.account.displayName}</Text></Pressable></Link>
                                        <View style={styles.progressContainer}>
                                            <ProgressBar
                                                progress={challengeProgress.percentage / 100}
                                                height={8}
                                                color="#667eea"
                                                backgroundColor={theme.surfaceTertiary}
                                                style={styles.progressBar}
                                            />
                                            <Text style={styles.progressText}>
                                                {Math.round(challengeProgress.percentage)}%
                                                • {Math.round(challengeProgress.absoluteValue)} {challengeOverview.activeChallenge.computation.unit}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                        ))}
                    </View>

                    {challengeOverview.leaderboard && challengeOverview.leaderboard.length > 0 && (
                        <View style={styles.leaderboardSection}>
                            <Text style={styles.sectionTitle}>🏆 Leaderboard</Text>
                            {challengeOverview.leaderboard.map((entry, index) => (
                                <View key={entry.account.authenticationId} style={styles.leaderboardCard}>
                                    <View style={styles.leaderboardRank}>
                                        <Text style={styles.rankNumber}>#{index + 1}</Text>
                                        {index === 0 &&
                                            <MaterialCommunityIcons name="crown" size={16} color="#FFD700"/>}
                                        {index === 1 &&
                                            <MaterialCommunityIcons name="medal" size={16} color="#C0C0C0"/>}
                                        {index === 2 &&
                                            <MaterialCommunityIcons name="medal" size={16} color="#CD7F32"/>}
                                    </View>
                                    <View style={styles.leaderboardInfo}>
                                        <Text style={styles.leaderboardName}>{entry.account.displayName}</Text>
                                        <Text style={styles.leaderboardPoints}>{entry.points} points</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </>
            );
        }
        return null;
    }, [activeTab, challengeHabit, challengeOverview, fetchData]);

    const renderTabContent = () => {
        if (!challengeOverview) return null;

        let data: ApiChallengeRead[] = [];

        switch (activeTab) {
            case 'active':
                data = [challengeOverview.activeChallenge];
                break;
            case 'proposed':
                data = challengeOverview.proposedChallenges;
                break;
            case 'created':
                data = challengeOverview.createdChallenges;
                break;
        }

        return (
            <FlatList
                data={data}
                renderItem={renderChallengeItem}
                keyExtractor={item => item.id.toString()}
                refreshing={refreshing}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No {activeTab} challenges found</Text>
                    </View>
                }
                ListFooterComponent={renderFooter}
            />
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2196F3"/>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'active' && styles.activeTab]}
                    onPress={() => setActiveTab('active')}
                >
                    <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>Active</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'proposed' && styles.activeTab]}
                    onPress={() => setActiveTab('proposed')}
                >
                    <Text style={[styles.tabText, activeTab === 'proposed' && styles.activeTabText]}>Proposed</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'created' && styles.activeTab]}
                    onPress={() => setActiveTab('created')}
                >
                    <Text style={[styles.tabText, activeTab === 'created' && styles.activeTabText]}>Created</Text>
                </TouchableOpacity>
            </View>

            {renderTabContent()}


            <View style={styles.buttonContainer}>
                {activeTab !== 'proposed' && (
                    <TouchableOpacity style={[styles.primaryButton, styles.flexButton]}
                                      onPress={() => router.push(`/challenge/edit/new`)}>
                        <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF"/>
                        <Text style={styles.buttonText}>Create challenge</Text>
                    </TouchableOpacity>
                )}

                {activeTab !== 'proposed' && (
                    <TouchableOpacity style={[styles.primaryButton, styles.flexButton]}
                                      onPress={() => setActiveTab('proposed')}>
                        <MaterialCommunityIcons name="vote" size={20} color="#FFFFFF"/>
                        <Text style={styles.buttonText}>Vote</Text>
                    </TouchableOpacity>
                )}

            </View>

        </View>
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 10,
        backgroundColor: theme.background,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.text,
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: theme.background,
        elevation: 2,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#2196F3',
    },
    tabText: {
        fontSize: 14,
        color: theme.textSecondary,
    },
    activeTabText: {
        color: '#2196F3',
        fontWeight: '500',
    },
    listContent: {
        padding: 12,
    },
    challengeCard: {
        backgroundColor: theme.surfaceSecondary,
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
    },
    challengeHeader: {
        marginBottom: 12,
    },
    challengeTitleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    challengeName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.text,
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: theme.surfaceTertiary,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500',
        color: theme.textSecondary,
    },
    timeRemainingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: theme.surfaceTertiary,
        borderRadius: 6,
        marginTop: 4,
        alignSelf: 'flex-start',
    },
    urgentBadge: {
        backgroundColor: '#FFF3E0',
    },
    expiredBadge: {
        backgroundColor: '#FFEBEE',
    },
    timeRemainingText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.textSecondary,
        marginLeft: 4,
    },
    urgentText: {
        color: '#FF9800',
    },
    expiredText: {
        color: '#F44336',
    },
    goalSection: {
        backgroundColor: theme.surface,
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        borderLeftWidth: 3,
        borderLeftColor: '#2196F3',
    },
    goalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    goalTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.text,
        marginLeft: 6,
    },
    goalDetails: {
        gap: 6,
    },
    goalItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    goalItemText: {
        fontSize: 13,
        color: theme.text,
        marginLeft: 6,
        flex: 1,
    },
    challengeDescription: {
        fontSize: 14,
        color: theme.text,
        marginBottom: 12,
    },
    challengeDates: {
        marginBottom: 12,
        backgroundColor: theme.surfaceTertiary,
    },
    dateText: {
        fontSize: 12,
        color: theme.text,
    },
    challengeFooter: {
        marginTop: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    votingSection: {
        flexDirection: 'row',
    },
    voteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        marginRight: 12,
        borderRadius: 4,
    },
    activeUpvote: {
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
    },
    activeDownvote: {
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
    },
    voteCount: {
        marginLeft: 4,
        fontSize: 14,
        color: theme.textSecondary,
    },
    actionButtons: {
        flexDirection: 'row',
    },
    actionButton: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 4,
        marginLeft: 8,
    },
    proposeButton: {
        backgroundColor: '#2196F3',
    },
    editButton: {
        backgroundColor: '#FF9800',
    },
    deleteButton: {
        backgroundColor: '#F44336',
    },
    actionButtonText: {
        fontSize: 12,
        color: '#FFFFFF',
        fontWeight: '500',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: theme.textSecondary,
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
        color: theme.textSecondary,
        marginLeft: 8,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 4,
    },
    primaryButton: {
        backgroundColor: '#2196F3',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        marginBottom: 12,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 16,
    },
    flexButton: {
        flex: 1,
    },
    participantsSection: {
        backgroundColor: theme.surfaceSecondary,
        padding: 20,
        borderRadius: 10,
        shadowColor: theme.shadow,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    participantCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    participantInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    participantDetails: {
        flex: 1,
    },
    participantName: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text,
        marginBottom: 8,
    },
    participantHabitName: {
        fontSize: 14,
        color: theme.textSecondary,
        marginTop: 2,
    },
    progressContainer: {
        flex: 1,
    },
    progressBar: {
        marginBottom: 4,
    },
    progressText: {
        fontSize: 12,
        color: theme.text,
        fontWeight: '500',
    },
    participantProgress: {
        alignItems: 'center',
    },
    participantPercentage: {
        fontSize: 12,
        color: theme.text,
        marginTop: 5,
    },
    leaderboardSection: {
        backgroundColor: theme.surfaceSecondary,
        padding: 20,
        borderRadius: 10,
        marginTop: 12,
        shadowColor: theme.shadow,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    leaderboardCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    leaderboardRank: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 50,
        marginRight: 12,
    },
    rankNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.text,
        marginRight: 4,
    },
    leaderboardInfo: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    leaderboardName: {
        fontSize: 16,
        fontWeight: '500',
        color: theme.text,
        flex: 1,
    },
    leaderboardPoints: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2196F3',
    },
}));

export default ChallengesScreen;
