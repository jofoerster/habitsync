import React, {useCallback, useRef, useState} from 'react';
import {ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {ApiChallengeRead, ApiChallengeWrite, ApiHabitRead, challengeApi} from '@/services/api';
import {MaterialCommunityIcons} from "@expo/vector-icons";
import {useFocusEffect, useLocalSearchParams, useRouter} from "expo-router";
import alert from "@/services/alert";
import HabitConfig, {ConfigType, HabitConfigRef} from "@/components/HabitConfig";
import {createThemedStyles} from "@/constants/styles";
import {useTheme} from "@/context/ThemeContext";

const EditChallengeScreen = () => {
    const {theme} = useTheme();
    const styles = createStyles(theme);

    const router = useRouter();
    const challengeId = useLocalSearchParams()['challengeId'] as string;
    const isNewChallenge = !challengeId || challengeId === 'new';

    const [challenge, setChallenge] = useState<ApiChallengeRead | null>(null);
    const [loading, setLoading] = useState(!isNewChallenge);
    const [saving, setSaving] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    const habitConfigRef = useRef<HabitConfigRef>(null);

    useFocusEffect(
        useCallback(() => {
            if (!isNewChallenge) {
                fetchChallenge();
            } else {
                setTitle('');
                setDescription('');
            }
        }, [challengeId, isNewChallenge])
    );

    const fetchChallenge = async () => {
        try {
            setLoading(true);
            const challengeData = await challengeApi.getChallengeById(parseInt(challengeId));

            setChallenge(challengeData);
            setTitle(challengeData.title);
            setDescription(challengeData.description);
        } catch (error) {
            console.error('Error fetching challenge:', error);
            alert('Error', 'Failed to load challenge details');
            router.push("/challenges");
        } finally {
            setLoading(false);
        }
    };

    const validateForm = (): boolean => {
        if (!title.trim()) {
            alert('Validation Error', 'Please enter a challenge title');
            return false;
        }
        if (!description.trim()) {
            alert('Validation Error', 'Please enter a challenge description');
            return false;
        }
        return true;
    };

    const handleSave = async () => {
        if (!validateForm()) return;

        try {
            setSaving(true);
            const updatedComputation = await habitConfigRef.current?.save();
            if (!updatedComputation) {
                return;
            }

            const challengeData: ApiChallengeWrite = {
                challengeId: isNewChallenge ? undefined : challenge?.id,
                title: title.trim(),
                description: description.trim(),
                computation: updatedComputation.progressComputation
            };

            let result: ApiChallengeRead;
            if (isNewChallenge) {
                result = await challengeApi.createChallenge(challengeData);
            } else {
                result = await challengeApi.updateChallenge(challengeData);
            }
            if (result) {
                router.push(`/challenge/edit/${result.id}`);
            } else {
                router.back();
            }
        } catch (error) {
            console.error('Error saving challenge:', error);
            alert('Error', isNewChallenge ? 'Failed to create challenge' : 'Failed to update challenge');
        } finally {
            setSaving(false);
        }
    };

    const handlePropose = async () => {
        if (!challenge) return;

        try {
            setSaving(true);
            await challengeApi.proposeChallenge(challenge.id);
            alert('Success', 'Challenge proposed successfully!');
            router.push("/challenges");
        } catch (error) {
            console.error('Error proposing challenge:', error);
            alert('Error', 'Failed to propose challenge');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = () => {
        if (!challenge) return;

        alert(
            'Delete Challenge',
            'Are you sure you want to delete this challenge? This action cannot be undone.',
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
                            setSaving(true);
                            await challengeApi.deleteChallenge(challenge.id);
                            alert('Success', 'Challenge deleted successfully!');
                            router.push("/challenges");
                        } catch (error) {
                            console.error('Error deleting challenge:', error);
                            alert('Error', 'Failed to delete challenge');
                        } finally {
                            setSaving(false);
                        }
                    }
                }
            ]
        );
    };

    const getHabitForProgressComputation = (): ApiHabitRead | undefined => {
        return challenge ? {
            account: {displayName: "", authenticationId: "", email: ""},
            color: 0,
            currentPercentage: 0,
            name: "",
            uuid: "",
            progressComputation: challenge.computation
        } : undefined
    }

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2196F3"/>
                <Text style={styles.loadingText}>Loading challenge...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <View style={styles.challengeIcon}>
                        <MaterialCommunityIcons
                            name="trophy"
                            size={40}
                            color="#2196F3"
                        />
                    </View>
                    <View style={styles.headerText}>
                        <Text style={styles.headerTitle}>
                            {isNewChallenge ? 'Create Challenge' : 'Edit Challenge'}
                        </Text>
                        <Text style={styles.headerSubtitle}>
                            {isNewChallenge ? 'Design a new challenge' : 'Modify challenge details'}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Title Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Challenge Title</Text>
                <TextInput
                    style={styles.titleInput}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Enter challenge title..."
                    placeholderTextColor="#999"
                />
            </View>

            {/* Description Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Description</Text>
                <TextInput
                    style={styles.descriptionInput}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Describe your challenge..."
                    placeholderTextColor="#999"
                    multiline
                    textAlignVertical="top"
                />
            </View>

            {/* Configuration Section */}
                <HabitConfig
                    ref={habitConfigRef}
                    configType={ConfigType.CHALLENGE}
                    showSaveButton={false}
                    habit={getHabitForProgressComputation()}
                />

            {/* Action Buttons */}
            <View style={styles.actionsSection}>
                <TouchableOpacity
                    style={[styles.primaryButton, saving && styles.disabledButton]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    <MaterialCommunityIcons
                        name="content-save"
                        size={20}
                        color="#FFFFFF"
                    />
                    <Text style={styles.primaryButtonText}>
                        {saving ? 'Saving...' : 'Save'}
                    </Text>
                </TouchableOpacity>

                {!isNewChallenge && challenge && (
                    <TouchableOpacity
                        style={[styles.proposeButton, saving && styles.disabledButton]}
                        onPress={handlePropose}
                        disabled={saving}
                    >
                        <MaterialCommunityIcons
                            name="send"
                            size={20}
                            color="#FFFFFF"
                        />
                        <Text style={styles.primaryButtonText}>
                            {saving ? 'Proposing...' : 'Propose'}
                        </Text>
                    </TouchableOpacity>
                )}

                {!isNewChallenge && challenge && (
                    <TouchableOpacity
                        style={[styles.deleteButton, saving && styles.disabledButton]}
                        onPress={handleDelete}
                        disabled={saving}
                    >
                        <MaterialCommunityIcons
                            name="delete"
                            size={20}
                            color="#FFFFFF"
                        />
                        <Text style={styles.primaryButtonText}>
                            Delete
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
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
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: theme.text,
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
    challengeIcon: {
        marginRight: 15,
    },
    headerText: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 5,
    },
    headerSubtitle: {
        fontSize: 16,
        color: theme.textSecondary,
    },
    section: {
        backgroundColor: theme.surface,
        marginHorizontal: 20,
        marginVertical: 10,
        padding: 20,
        borderRadius: 10,
        shadowColor: theme.shadow,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 10,
    },
    titleInput: {
        fontSize: 16,
        color: theme.text,
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 8,
        padding: 12,
        backgroundColor: theme.surface,
    },
    descriptionInput: {
        fontSize: 16,
        color: theme.text,
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 8,
        padding: 12,
        backgroundColor: theme.surface,
        minHeight: 100,
    },
    actionsSection: {
        margin: 15,
        marginBottom: 30,
        gap: 10,
    },
    primaryButton: {
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
    proposeButton: {
        backgroundColor: '#4CAF50',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    deleteButton: {
        backgroundColor: '#F44336',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    disabledButton: {
        opacity: 0.6,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 10,
    },
}));

export default EditChallengeScreen;