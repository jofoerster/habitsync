import {
    ApiAccountRead,
    ApiChallengeOverviewRead,
    ApiChallengeRead,
    ApiComputationReadWrite,
    ApiHabitRead,
    challengeApi,
    ChallengeComputationType,
    ChallengeStatus,
    FrequencyTypeDTO
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
import {AuthService} from "@/services/auth";
import {MAX_INTEGER} from "@/constants/numbers";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

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

    const isCustomFrequency = (progressComputation: ApiComputationReadWrite) => {
        return progressComputation.frequencyType === FrequencyTypeDTO.DAILY || progressComputation.frequency !== 1;
    }

    const getFrequencyTypeText = (progressComputation: ApiComputationReadWrite) => {
        if (progressComputation.frequency !== 1 || progressComputation.frequencyType === FrequencyTypeDTO.DAILY) {
            return "Daily";
        }
        if (progressComputation.frequencyType === FrequencyTypeDTO.WEEKLY) {
            return "Weekly";
        }
        if (progressComputation.frequencyType === FrequencyTypeDTO.MONTHLY) {
            return "Monthly";
        }
    }

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
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
        const endDate = new Date((endDay + 1) * 86400000);
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

    const getChallengesByTab = () => {
        if (!challengeOverview) return [];

        switch (activeTab) {
            case 'active':
                return challengeOverview.activeChallenge ? [challengeOverview.activeChallenge] : [];
            case 'proposed':
                return challengeOverview.proposedChallenges;
            case 'created':
                return challengeOverview.createdChallenges;
            default:
                return [];
        }
    };

    const getTabCounts = () => {
        if (!challengeOverview) return {active: 0, proposed: 0, created: 0};

        return {
            active: challengeOverview.activeChallenge ? 1 : 0,
            proposed: challengeOverview.proposedChallenges.length,
            created: challengeOverview.createdChallenges.length
        };
    };

    const shouldShowResultsBanner = () => {
        const now = new Date();
        const utcDate = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
        return utcDate.getUTCDate() === 1;
    };
    const renderChallengeItem = ({item}: { item: ApiChallengeRead }) => {
        const isProposed = item.status === ChallengeStatus.PROPOSED;
        const isActive = item.status === ChallengeStatus.ACTIVE;
        const timeRemaining = isActive ? getTimeRemaining(item.endDay) : null;
        const isAsMuchAsPossibleChallenge = item.computation.challengeComputationType === ChallengeComputationType.RELATIVE &&
            item.computation.frequency === 1 && item.computation.dailyReachableValue === MAX_INTEGER;

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
                        <Text style={styles.goalTitle}>Progress Computation</Text>
                    </View>

                    <View style={styles.goalDetails}>
                        <View style={styles.goalItem}>
                            <MaterialCommunityIcons name="function" size={16} color="#666"/>
                            <Text style={styles.goalItemText}>
                                {item.computation?.challengeComputationType}
                            </Text>
                        </View>

                        {isAsMuchAsPossibleChallenge && (
                            <View style={styles.goalItem}>
                                <MaterialCommunityIcons name="ruler" size={16} color="#666"/>
                                <Text style={styles.goalItemText}>
                                    As many {item.computation.unit} as possible
                                </Text>
                            </View>
                        )}

                        {item.computation.challengeComputationType !== ChallengeComputationType.MAX_VALUE && !isAsMuchAsPossibleChallenge && isCustomFrequency(item.computation) && (
                            <View style={styles.goalItem}>
                                <MaterialCommunityIcons name="calendar-clock" size={16} color="#666"/>
                                <Text style={styles.goalItemText}>
                                    {formatFrequency(item?.computation)}
                                </Text>
                            </View>
                        )}

                        {item.computation?.dailyReachableValue && !isAsMuchAsPossibleChallenge && (
                            <View style={styles.goalItem}>
                                <MaterialCommunityIcons name="ruler" size={16} color="#666"/>
                                <Text style={styles.goalItemText}>
                                    {getFrequencyTypeText(item.computation)}: {item.computation.dailyReachableValue} {item.computation.unit}
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

                    {(item.status === ChallengeStatus.PROPOSED && item.account.authenticationId === currentUser?.authenticationId) && (
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
                        hideProgressRing={true}
                    />
                    <View style={styles.participantsSection}>
                        <Text style={styles.sectionTitle}>Challenge Progress
                            ({challengeOverview.progressCurrentChallengeUsers.length})</Text>
                        {challengeOverview.progressCurrentChallengeUsers.map(challengeProgress => (

                            <View key={challengeProgress.account.authenticationId} style={styles.participantCard}>

                                <View style={styles.participantInfo}>
                                    <View style={styles.participantDetails}>
                                        <Link
                                            href={challengeProgress.linkToHabit + (challengeProgress.account.authenticationId === currentUser?.authenticationId ? '?isOwnHabit=true' : '') as any}>
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
    }, [activeTab, challengeHabit, challengeOverview, fetchData, currentUser?.authenticationId]);

    const renderSegmentedControl = () => {
        const counts = getTabCounts();

        return (
            <View style={styles.segmentedControl}>
                <TouchableOpacity
                    style={[styles.segment, activeTab === 'active' && styles.activeSegment]}
                    onPress={() => setActiveTab('active')}
                >
                    <MaterialCommunityIcons
                        name="trophy"
                        size={16}
                        color={activeTab === 'active' ? '#FFFFFF' : theme.textSecondary}
                    />
                    <Text style={[styles.segmentText, activeTab === 'active' && styles.activeSegmentText]}>
                        Active
                    </Text>
                    {counts.active > 0 && (
                        <View style={styles.segmentBadge}>
                            <Text style={styles.segmentBadgeText}>{counts.active}</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.segment, activeTab === 'proposed' && styles.activeSegment]}
                    onPress={() => setActiveTab('proposed')}
                >
                    <MaterialCommunityIcons
                        name="vote"
                        size={16}
                        color={activeTab === 'proposed' ? '#FFFFFF' : theme.textSecondary}
                    />
                    <Text style={[styles.segmentText, activeTab === 'proposed' && styles.activeSegmentText]}>
                        Proposed
                    </Text>
                    {counts.proposed > 0 && (
                        <View style={styles.segmentBadge}>
                            <Text style={styles.segmentBadgeText}>{counts.proposed}</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.segment, activeTab === 'created' && styles.activeSegment]}
                    onPress={() => setActiveTab('created')}
                >
                    <MaterialCommunityIcons
                        name="pencil"
                        size={16}
                        color={activeTab === 'created' ? '#FFFFFF' : theme.textSecondary}
                    />
                    <Text style={[styles.segmentText, activeTab === 'created' && styles.activeSegmentText]}>
                        Created
                    </Text>
                    {counts.created > 0 && (
                        <View style={styles.segmentBadge}>
                            <Text style={styles.segmentBadgeText}>{counts.created}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        );
    };

    const renderEmptyState = () => {
        const getEmptyStateContent = () => {
            switch (activeTab) {
                case 'active':
                    return {
                        icon: 'trophy-outline' as IconName,
                        title: 'No Active Challenge',
                        description: 'A new challenge will start at the beginning of each month.',
                        primaryAction: {
                            text: 'Vote on Proposals',
                            icon: 'vote' as IconName,
                            onPress: () => setActiveTab('proposed')
                        },
                        secondaryAction: {
                            text: 'Create Challenge',
                            icon: 'plus' as IconName,
                            onPress: () => router.push('/challenge/edit/new')
                        }
                    };
                case 'proposed':
                    return {
                        icon: 'vote-outline' as IconName,
                        title: 'No Proposed Challenges',
                        description: 'Propose one of your created challenges or create a new one!',
                        primaryAction: {
                            text: 'Create Challenge',
                            icon: 'plus' as IconName,
                            onPress: () => router.push('/challenge/edit/new')
                        },
                        secondaryAction: {
                            text: 'View Created',
                            icon: 'pencil' as IconName,
                            onPress: () => setActiveTab('created')
                        }
                    };
                case 'created':
                    return {
                        icon: 'pencil-outline' as IconName,
                        title: 'No Created Challenges',
                        description: 'Create a challenge and propose it to others',
                        primaryAction: {
                            text: 'Create Challenge',
                            icon: 'plus' as IconName,
                            onPress: () => router.push('/challenge/edit/new')
                        },
                        secondaryAction: {
                            text: 'Vote on Proposals',
                            icon: 'vote' as IconName,
                            onPress: () => setActiveTab('proposed')
                        }
                    };
                default:
                    return null;
            }
        };

        const content = getEmptyStateContent();
        if (!content) return null;

        return (
            <View style={styles.emptyStateContainer}>
                <MaterialCommunityIcons
                    name={content.icon}
                    size={64}
                    color={theme.textSecondary}
                    style={styles.emptyStateIcon}
                />
                <Text style={styles.emptyStateTitle}>{content.title}</Text>
                <Text style={styles.emptyStateDescription}>{content.description}</Text>

                <View style={styles.emptyStateActions}>
                    <TouchableOpacity
                        style={styles.primaryActionButton}
                        onPress={content.primaryAction.onPress}
                    >
                        <MaterialCommunityIcons
                            name={content.primaryAction.icon}
                            size={20}
                            color="#FFFFFF"
                        />
                        <Text style={styles.primaryActionText}>{content.primaryAction.text}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryActionButton}
                        onPress={content.secondaryAction.onPress}
                    >
                        <MaterialCommunityIcons
                            name={content.secondaryAction.icon}
                            size={18}
                            color={theme.primary}
                        />
                        <Text style={styles.secondaryActionText}>{content.secondaryAction.text}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderContent = () => {
        if (!challengeOverview) return null;

        const challenges = getChallengesByTab();

        if (challenges.length === 0) {
            return renderEmptyState();
        }

        return (
            <FlatList
                data={challenges}
                renderItem={renderChallengeItem}
                keyExtractor={item => item.id.toString()}
                refreshing={refreshing}
                onRefresh={fetchData}
                contentContainerStyle={styles.listContent}
                ListFooterComponent={renderFooter}
                showsVerticalScrollIndicator={false}
            />
        );
    };


    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.primary}/>
                <Text style={styles.loadingText}>Loading challenges...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {shouldShowResultsBanner() && (
                <View style={styles.resultsBanner}>
                    <MaterialCommunityIcons name="information" size={20} color="#2196F3"/>
                    <Text style={styles.bannerText}>
                        If last month&apos;s challenge was active, results will be published tomorrow! (UTC). Last
                        chance to
                        log challenge progress today!
                    </Text>
                </View>
            )}

            <View>
                <Text style={styles.header}>Challenge</Text>
                <Text style={styles.subHeader}>Challenge your friends</Text>
            </View>

            {renderSegmentedControl()}
            {renderContent()}
        </View>
    );
};

const createStyles = createThemedStyles((theme) => StyleSheet.create({
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
        marginTop: 8,
        fontSize: 16,
        color: theme.textSecondary,
    },
    // Segmented Control Styles
    segmentedControl: {
        flexDirection: 'row',
        backgroundColor: theme.surface,
        borderRadius: 12,
        margin: 16,
        marginTop: 16,
        padding: 4,
        elevation: 2,
        shadowColor: theme.shadow,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    segment: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 8,
        position: 'relative',
        gap: 6,
    },
    activeSegment: {
        backgroundColor: theme.primary,
    },
    segmentText: {
        fontSize: 14,
        color: theme.textSecondary,
        fontWeight: '500',
    },
    activeSegmentText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    segmentBadge: {
        backgroundColor: theme.primary,
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginLeft: 4,
    },
    segmentBadgeText: {
        fontSize: 10,
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    // List and Content Styles
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    // Challenge Card Styles
    challengeCard: {
        backgroundColor: theme.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: theme.shadow,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
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
        marginRight: 8,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: theme.surfaceSecondary,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.textSecondary,
        textTransform: 'capitalize',
    },
    challengeDescription: {
        fontSize: 14,
        color: theme.textSecondary,
        lineHeight: 20,
    },
    // Time and Date Styles
    timeRemainingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 5,
        backgroundColor: theme.surfaceTertiary,
        borderRadius: 6,
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
    // Goal Section Styles
    goalSection: {
        backgroundColor: theme.surface,
        marginVertical: 20,
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
    // Action and Voting Styles
    challengeFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    votingSection: {
        flexDirection: 'row',
        gap: 8,
    },
    voteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: theme.surfaceSecondary,
    },
    activeUpvote: {
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
    },
    activeDownvote: {
        backgroundColor: 'rgba(244, 67, 54, 0.2)',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        minWidth: 60,
        alignItems: 'center',
    },
    proposeButton: {
        backgroundColor: '#4CAF50',
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
        fontWeight: '600',
    },
    // Empty State Styles
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingVertical: 48,
    },
    emptyStateIcon: {
        marginBottom: 16,
        opacity: 0.6,
    },
    emptyStateTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyStateDescription: {
        fontSize: 16,
        color: theme.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    emptyStateActions: {
        flexDirection: 'column',
        gap: 12,
        width: '100%',
        maxWidth: 280,
    },
    primaryActionButton: {
        backgroundColor: theme.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        elevation: 2,
        shadowColor: theme.shadow,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    primaryActionText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    secondaryActionButton: {
        backgroundColor: 'transparent',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: theme.primary,
    },
    secondaryActionText: {
        color: theme.primary,
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    // Progress and Participants Styles
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 12,
    },
    participantsSection: {
        backgroundColor: theme.surface,
        padding: 16,
        borderRadius: 12,
        marginTop: 0,
        elevation: 2,
        shadowColor: theme.shadow,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    participantCard: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    participantInfo: {
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
    progressContainer: {
        flex: 1,
    },
    progressBar: {
        marginBottom: 6,
    },
    progressText: {
        fontSize: 13,
        color: theme.textSecondary,
        fontWeight: '500',
    },
    // Leaderboard Styles
    leaderboardSection: {
        backgroundColor: theme.surface,
        padding: 16,
        borderRadius: 12,
        marginTop: 16,
        elevation: 2,
        shadowColor: theme.shadow,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
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
        color: theme.primary,
    },
    // Banner Styles
    resultsBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        padding: 16,
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 12,
        elevation: 1,
    },
    bannerText: {
        fontSize: 14,
        color: '#1565C0',
        marginLeft: 8,
        flex: 1,
        lineHeight: 20,
    },
}));

export default ChallengesScreen;
