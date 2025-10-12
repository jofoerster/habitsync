import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,} from 'react-native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import {useTheme} from '@/context/ThemeContext';
import {createThemedStyles} from '@/constants/styles';
import {ApiAccountRead, ApiHabitRead, ApiSharedHabitRead, habitApi, sharedHabitApi,} from '@/services/api';
import {getBackendBaseUrl, getUiBaseUrl, UI_BASE_URL} from '@/public/config';
import alert from '@/services/alert';

interface ShareHabitModalProps {
    visible: boolean;
    onClose: () => void;
    habitDetail: ApiHabitRead;
    sharedHabits: ApiSharedHabitRead[];
    isOwnHabit: boolean;
    onUpdate: () => void;
}

const ShareHabitModal: React.FC<ShareHabitModalProps> = ({
                                                             visible,
                                                             onClose,
                                                             habitDetail,
                                                             sharedHabits,
                                                             isOwnHabit,
                                                             onUpdate,
                                                         }) => {
    const {theme} = useTheme();
    const styles = createStyles(theme);

    const [activeTab, setActiveTab] = useState<'share' | 'participants'>('share');
    const [inviteAuthId, setInviteAuthId] = useState('');
    const [participants, setParticipants] = useState<ApiAccountRead[]>([]);
    const [loadingParticipants, setLoadingParticipants] = useState(false);
    const [inviting, setInviting] = useState(false);
    const [shareUrl, setShareUrl] = useState('loading...');

    const sharedHabit = sharedHabits.length > 0 ? sharedHabits[0] : null;

    useEffect(() => {
        loadBackendUrl();
        if (visible && sharedHabit && isOwnHabit) {
            loadParticipants();
        }
    }, [visible, sharedHabit]);

    const loadBackendUrl = async () => {
        const uiBaseUrl = await getUiBaseUrl();
        setShareUrl(sharedHabit ? `${uiBaseUrl}/share/${sharedHabit.shareCode}` : '');
    }

    const loadParticipants = async () => {
        if (!habitDetail?.uuid) return;

        setLoadingParticipants(true);
        try {
            const participantList = await habitApi.listParticipants(habitDetail.uuid);
            setParticipants(participantList);
        } catch (error) {
            console.error('Error loading participants:', error);
        } finally {
            setLoadingParticipants(false);
        }
    };

    const handleCreateShare = async () => {
        try {
            await sharedHabitApi.createSharedHabit({
                habitUuid: habitDetail.uuid,
                title: habitDetail.name,
                progressComputation: habitDetail.progressComputation,
            });
            onUpdate();
            alert('Success', 'Shared habit created successfully!');
        } catch (error) {
            console.error('Error creating shared habit:', error);
            alert('Error', 'Failed to create shared habit');
        }
    };

    const handleCopyShareCode = async () => {
        if (!shareUrl) return;
        await Clipboard.setStringAsync(shareUrl);
        alert('Copied', 'Share link copied to clipboard!');
    };

    const handleInviteParticipant = async () => {
        if (!inviteAuthId.trim()) {
            alert('Error', 'Please enter an authentication ID');
            return;
        }

        setInviting(true);
        try {
            await habitApi.inviteParticipant(habitDetail.uuid, inviteAuthId.trim());
            setInviteAuthId('');
            await loadParticipants();
            alert('Success', 'Invitation sent successfully!');
        } catch (error) {
            console.error('Error inviting participant:', error);
            alert('Error', 'Failed to send invitation. Make sure the authentication ID is correct.');
        } finally {
            setInviting(false);
        }
    };

    const handleRemoveParticipant = async (authId: string) => {
        alert(
            'Remove Participant',
            'Are you sure you want to remove this participant?',
            [
                {text: 'Cancel', style: 'cancel'},
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await habitApi.removeParticipant(habitDetail.uuid, authId);
                            await loadParticipants();
                            alert('Success', 'Participant removed successfully!');
                        } catch (error) {
                            console.error('Error removing participant:', error);
                            alert('Error', 'Failed to remove participant');
                        }
                    },
                },
            ]
        );
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Share & Collaborate</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <MaterialCommunityIcons name="close" size={24} color={theme.text}/>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'share' && styles.activeTab]}
                            onPress={() => setActiveTab('share')}
                        >
                            <MaterialCommunityIcons
                                name="share-variant"
                                size={20}
                                color={activeTab === 'share' ? theme.primary : theme.textSecondary}
                            />
                            <Text style={[styles.tabText, activeTab === 'share' && styles.activeTabText]}>
                                Share
                            </Text>
                        </TouchableOpacity>

                        {isOwnHabit && (
                            <TouchableOpacity
                                style={[styles.tab, activeTab === 'participants' && styles.activeTab]}
                                onPress={() => setActiveTab('participants')}
                            >
                                <MaterialCommunityIcons
                                    name="account-multiple"
                                    size={20}
                                    color={activeTab === 'participants' ? theme.primary : theme.textSecondary}
                                />
                                <Text style={[styles.tabText, activeTab === 'participants' && styles.activeTabText]}>
                                    Participants
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <ScrollView style={styles.content}>
                        {activeTab === 'share' ? (
                            <View style={styles.shareContent}>
                                {sharedHabit ? (
                                    <View>
                                        <Text style={styles.sectionTitle}>Share Link</Text>
                                        <Text style={styles.description}>
                                            Share this link with others to let them join and track this habit together.
                                        </Text>

                                        <View style={styles.shareLinkContainer}>
                                            <Text style={styles.shareLink} numberOfLines={1}>
                                                {shareUrl}
                                            </Text>
                                        </View>

                                        <TouchableOpacity style={styles.primaryButton} onPress={handleCopyShareCode}>
                                            <MaterialCommunityIcons name="content-copy" size={20} color="#FFFFFF"/>
                                            <Text style={styles.primaryButtonText}>Copy Share Link</Text>
                                        </TouchableOpacity>

                                        <View style={styles.infoBox}>
                                            <MaterialCommunityIcons name="information" size={20} color={theme.primary}/>
                                            <Text style={styles.infoText}>
                                                Anyone with this link can join and sync their progress with yours.
                                            </Text>
                                        </View>
                                    </View>
                                ) : (
                                    <View>
                                        <Text style={styles.sectionTitle}>Create Shared Habit</Text>
                                        <Text style={styles.description}>
                                            Create a shareable version of this habit to track progress with friends,
                                            family, or colleagues.
                                        </Text>

                                        <TouchableOpacity style={styles.primaryButton} onPress={handleCreateShare}>
                                            <MaterialCommunityIcons name="share-variant" size={20} color="#FFFFFF"/>
                                            <Text style={styles.primaryButtonText}>Create Share Link</Text>
                                        </TouchableOpacity>

                                        <View style={styles.infoBox}>
                                            <MaterialCommunityIcons name="information" size={20} color={theme.primary}/>
                                            <Text style={styles.infoText}>
                                                Once created, you will get a link to share with others.
                                            </Text>
                                        </View>
                                    </View>
                                )}
                            </View>
                        ) : (
                            <View style={styles.participantsContent}>
                                <Text style={styles.sectionTitle}>Invite Participants</Text>
                                <Text style={styles.description}>
                                    Invite others directly by their authentication ID to participate in this habit.
                                </Text>

                                <View style={styles.inviteContainer}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter authentication ID"
                                        placeholderTextColor={theme.textSecondary}
                                        value={inviteAuthId}
                                        onChangeText={setInviteAuthId}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                    <TouchableOpacity
                                        style={[styles.inviteButton, inviting && styles.inviteButtonDisabled]}
                                        onPress={handleInviteParticipant}
                                        disabled={inviting}
                                    >
                                        {inviting ? (
                                            <ActivityIndicator size="small" color="#FFFFFF"/>
                                        ) : (
                                            <MaterialCommunityIcons name="account-plus" size={20} color="#FFFFFF"/>
                                        )}
                                    </TouchableOpacity>
                                </View>

                                <Text style={[styles.sectionTitle, {marginTop: 24}]}>Current Participants</Text>

                                {loadingParticipants ? (
                                    <View style={styles.loadingContainer}>
                                        <ActivityIndicator size="small" color={theme.primary}/>
                                    </View>
                                ) : participants.length > 0 ? (
                                    <View style={styles.participantsList}>
                                        {participants.map((participant) => (
                                            <View key={participant.authenticationId} style={styles.participantItem}>
                                                <View style={styles.participantInfo}>
                                                    <MaterialCommunityIcons
                                                        name="account-circle"
                                                        size={40}
                                                        color={theme.primary}
                                                    />
                                                    <View style={styles.participantDetails}>
                                                        <Text style={styles.participantName}>
                                                            {participant.displayName}
                                                        </Text>
                                                        <Text style={styles.participantAuthId}>
                                                            {participant.authenticationId}
                                                        </Text>
                                                    </View>
                                                </View>
                                                {participant.authenticationId !== habitDetail.account.authenticationId && (
                                                    <TouchableOpacity
                                                        onPress={() => handleRemoveParticipant(participant.authenticationId)}
                                                        style={styles.removeButton}
                                                    >
                                                        <MaterialCommunityIcons name="close-circle" size={24}
                                                                                color="#F44336"/>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        ))}
                                    </View>
                                ) : (
                                    <View style={styles.emptyState}>
                                        <MaterialCommunityIcons name="account-off" size={48}
                                                                color={theme.textSecondary}/>
                                        <Text style={styles.emptyStateText}>No participants yet</Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const createStyles = createThemedStyles((theme) =>
    StyleSheet.create({
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            padding: 20,
        },
        modalContainer: {
            backgroundColor: theme.surface,
            borderRadius: 20,
            paddingBottom: 20,
            maxHeight: '80%',
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 20,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
        },
        headerTitle: {
            fontSize: 20,
            fontWeight: 'bold',
            color: theme.text,
        },
        closeButton: {
            padding: 4,
        },
        tabContainer: {
            flexDirection: 'row',
            padding: 16,
            gap: 8,
        },
        tab: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 12,
            backgroundColor: theme.background,
            gap: 8,
        },
        activeTab: {
            backgroundColor: theme.surfaceTertiary,
        },
        tabText: {
            fontSize: 14,
            fontWeight: '500',
            color: theme.textSecondary,
        },
        activeTabText: {
            color: theme.primary,
            fontWeight: '600',
        },
        content: {
            flexShrink: 1,
        },
        shareContent: {
            padding: 20,
        },
        participantsContent: {
            padding: 20,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: theme.text,
            marginBottom: 8,
        },
        description: {
            fontSize: 14,
            color: theme.textSecondary,
            marginBottom: 20,
            lineHeight: 20,
        },
        shareLinkContainer: {
            backgroundColor: theme.background,
            padding: 16,
            borderRadius: 12,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: theme.border,
        },
        shareLink: {
            fontSize: 14,
            color: theme.text,
            fontFamily: 'monospace',
        },
        primaryButton: {
            backgroundColor: theme.primary,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 14,
            borderRadius: 12,
            gap: 8,
            marginBottom: 16,
        },
        primaryButtonText: {
            color: '#FFFFFF',
            fontSize: 16,
            fontWeight: '600',
        },
        infoBox: {
            flexDirection: 'row',
            backgroundColor: theme.background,
            padding: 12,
            borderRadius: 12,
            gap: 12,
            alignItems: 'flex-start',
        },
        infoText: {
            flex: 1,
            fontSize: 13,
            color: theme.textSecondary,
            lineHeight: 18,
        },
        inviteContainer: {
            flexDirection: 'row',
            gap: 12,
            marginBottom: 8,
        },
        input: {
            flex: 1,
            backgroundColor: theme.background,
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            fontSize: 14,
            color: theme.text,
        },
        inviteButton: {
            backgroundColor: theme.primary,
            width: 48,
            height: 48,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
        },
        inviteButtonDisabled: {
            opacity: 0.5,
        },
        participantsList: {
            gap: 12,
        },
        participantItem: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: theme.background,
            padding: 12,
            borderRadius: 12,
        },
        participantInfo: {
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
            gap: 12,
        },
        participantDetails: {
            flex: 1,
        },
        participantName: {
            fontSize: 16,
            fontWeight: '600',
            color: theme.text,
        },
        participantAuthId: {
            fontSize: 12,
            color: theme.textSecondary,
            marginTop: 2,
        },
        removeButton: {
            padding: 4,
        },
        loadingContainer: {
            padding: 20,
            alignItems: 'center',
        },
        emptyState: {
            alignItems: 'center',
            padding: 32,
        },
        emptyStateText: {
            fontSize: 14,
            color: theme.textSecondary,
            marginTop: 12,
        },
    })
);

export default ShareHabitModal
