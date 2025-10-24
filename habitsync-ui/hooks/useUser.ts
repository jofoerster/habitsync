import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {ApiAccountRead, ApiAccountSettingsReadWrite, userApi,} from '@/services/api';
import {habitKeys} from './useHabits';
import {challengeKeys} from './useChallenges';
import {sharedHabitKeys} from './useSharedHabits';
import {notificationKeys, numberModalKeys} from './useNotifications';

export const userKeys = {
    all: ['user'] as const,
    info: () => [...userKeys.all, 'info'] as const,
    settings: () => [...userKeys.all, 'settings'] as const,
    unapproved: () => [...userKeys.all, 'unapproved'] as const,
    invitations: () => [...userKeys.all, 'invitations'] as const,
    apiKey: () => [...userKeys.all, 'api-key'] as const,
};

export const useUserInfo = () => {
    return useQuery({
        queryKey: userKeys.info(),
        queryFn: () => userApi.getUserInfo(),
        staleTime: 1000 * 60 * 10, // 10 minutes
    });
};

export const useUserSettings = () => {
    return useQuery({
        queryKey: userKeys.settings(),
        queryFn: () => userApi.getUserSettings(),
        staleTime: 1000 * 60 * 5,
    });
};

export const useUnapprovedUsers = () => {
    return useQuery({
        queryKey: userKeys.unapproved(),
        queryFn: () => userApi.getUnapprovedUsers(),
        staleTime: 1000 * 60 * 2,
    });
};

export const useHabitInvitations = () => {
    return useQuery({
        queryKey: userKeys.invitations(),
        queryFn: () => userApi.getHabitInvitations(),
        staleTime: 1000 * 60 * 2,
    });
};

export const useApiKey = () => {
    return useQuery({
        queryKey: userKeys.apiKey(),
        queryFn: () => userApi.getApiKey(),
        staleTime: 1000 * 60 * 30, // 30 minutes
    });
};

export const useUpdateUserSettings = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (settings: ApiAccountSettingsReadWrite) =>
            userApi.updateUserSettings(settings),
        onSuccess: (updatedSettings) => {
            queryClient.setQueryData(userKeys.settings(), updatedSettings);
            // Also update user info cache if it exists
            queryClient.invalidateQueries({queryKey: userKeys.info()});
        },
    });
};

export const useApproveUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (accountUuid: string) => userApi.approveUser(accountUuid),
        onSuccess: (_, accountUuid) => {
            // Optimistically remove from unapproved list
            queryClient.setQueryData<ApiAccountRead[]>(
                userKeys.unapproved(),
                (old) => old?.filter((user) => user.authenticationId !== accountUuid)
            );
        },
    });
};

export const useEvictApiKeys = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => userApi.evictAllApiKeys(),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: userKeys.apiKey()});
        },
    });
};

export const useClearAllCache = () => {
    const queryClient = useQueryClient();

    return () => {
        queryClient.clear();
    };
};
