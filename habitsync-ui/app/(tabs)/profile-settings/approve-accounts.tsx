import React, {useCallback, useState} from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {ApiAccountRead, userApi} from '@/services/api';
import {useFocusEffect} from 'expo-router';
import {MaterialCommunityIcons} from "@expo/vector-icons";
import alert from "@/services/alert";
import {useTheme} from "@/context/ThemeContext";
import {createThemedStyles} from "@/constants/styles";


const ApproveAccountsScreen = () => {
    const {theme} = useTheme();
    const styles = createStyles(theme);

    const [unapprovedUsers, setUnapprovedUsers] = useState<ApiAccountRead[]>([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            loadUnapprovedUsers();
        }, [])
    );

    const loadUnapprovedUsers = async () => {
        try {
            const users = await userApi.getUnapprovedUsers();
            setUnapprovedUsers(users);
        } catch (error) {
            alert('Error', 'Failed to load unapproved users');
        } finally {
            setLoading(false);
        }
    };

    const handleApproveUser = async (user: ApiAccountRead) => {
        alert(
            'Approve User',
            `Are you sure you want to approve ${user.displayName} (${user.email})?`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Approve',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await userApi.approveUser(user.authenticationId);
                            alert('Success', `${user.displayName} has been approved`);
                            loadUnapprovedUsers();
                        } catch (error) {
                            alert('Error', 'Failed to approve user');
                        }
                    },
                },
            ]
        );
    };

    const renderUserItem = ({item}: {item: ApiAccountRead}) => (
        <View style={styles.userCard}>
            <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.displayName}</Text>
                <Text style={styles.userEmail}>{item.email}</Text>
            </View>
            <TouchableOpacity
                style={styles.approveButton}
                onPress={() => handleApproveUser(item)}
            >
                <MaterialCommunityIcons name="check" size={20} color="white" />
                <Text style={styles.approveButtonText}>Approve</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading unapproved accounts...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Approve Accounts</Text>
            {unapprovedUsers.length === 0 ? (
                <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="account-check" size={64} color="#ccc"/>
                    <Text style={styles.emptyStateText}>No pending approvals</Text>
                    <Text style={styles.emptyStateSubText}>All users are already approved</Text>
                </View>
            ) : (
                <FlatList
                    data={unapprovedUsers}
                    renderItem={renderUserItem}
                    keyExtractor={(item) => item.authenticationId}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
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
        marginBottom: 13,
        marginTop: 16,
        paddingLeft: 16,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 6,
        paddingBottom: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.surfaceSecondary,
    },
    loadingText: {
        fontSize: 16,
        color: theme.text,
        marginTop: 10,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyStateText: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.textSecondary,
        marginTop: 16,
    },
    emptyStateSubText: {
        fontSize: 14,
        color: theme.textSecondary,
        marginTop: 8,
    },
    userCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: theme.shadow,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text,
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: theme.textSecondary,
    },
    approveButton: {
        backgroundColor: '#28a745',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        gap: 6,
    },
    approveButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    },
}));

export default ApproveAccountsScreen;
