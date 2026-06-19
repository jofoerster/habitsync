import React, {useCallback, useState} from 'react';
import {useTranslation} from 'react-i18next';
import { FlatList, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {ApiAccountRead, userApi} from '@/services/api';
import {useFocusEffect} from 'expo-router';
import {MaterialCommunityIcons} from "@expo/vector-icons";
import alert from "@/services/alert";
import {useTheme} from "@/context/ThemeContext";
import {createThemedStyles} from "@/constants/styles";
import {useHabit} from "@/hooks/useHabits";
import {useApproveUser, useUnapprovedUsers} from "@/hooks/useUser";


const ApproveAccountsScreen = () => {
    const {t} = useTranslation();
    const {theme} = useTheme();
    const styles = createStyles(theme);

    const {data: unapprovedUsers, isLoading: loading} = useUnapprovedUsers();
    const approveUserMutation = useApproveUser();

    const handleApproveUser = async (user: ApiAccountRead) => {
        alert(
            t('approveAccounts.approveUserTitle'),
            t('approveAccounts.approveUserMessage', {name: user.displayName, email: user.email}),
            [
                {
                    text: t('common.cancel'),
                    style: 'cancel',
                },
                {
                    text: t('approveAccounts.approve'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await approveUserMutation.mutateAsync(user.authenticationId);
                            alert(t('common.success'), t('approveAccounts.userApproved', {name: user.displayName}));
                        } catch (error) {
                            alert(t('common.error'), t('approveAccounts.approveFailed'));
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
                <Text style={styles.approveButtonText}>{t('approveAccounts.approve')}</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>{t('approveAccounts.loading')}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.header}>{t('approveAccounts.title')}</Text>
            {!unapprovedUsers || unapprovedUsers.length === 0 ? (
                <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="account-check" size={64} color="#ccc"/>
                    <Text style={styles.emptyStateText}>{t('approveAccounts.noPending')}</Text>
                    <Text style={styles.emptyStateSubText}>{t('approveAccounts.allApproved')}</Text>
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
        marginTop: 42,
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
        backgroundColor: theme.background,
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
