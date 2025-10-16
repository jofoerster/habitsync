import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {habitNumberModalApi, notificationApi, NotificationConfig,} from '@/services/api';
import {habitKeys} from './useHabits';

export const notificationKeys = {
    all: ['notifications'] as const,
    habit: (habitUuid: string) => [...notificationKeys.all, 'habit', habitUuid] as const,
};

export const numberModalKeys = {
    all: ['numberModal'] as const,
    habit: (habitUuid: string) => [...numberModalKeys.all, habitUuid] as const,
};

export const useNumberModalConfig = (habitUuid: string, enabled = true) => {
    return useQuery({
        queryKey: numberModalKeys.habit(habitUuid),
        queryFn: () => habitNumberModalApi.getNumberModal(habitUuid),
        enabled: enabled && !!habitUuid,
        staleTime: 1000 * 60 * 5,
    });
};

export const useUpdateNotificationForHabit = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({habitUuid, config}: { habitUuid: string; config: NotificationConfig }) =>
            notificationApi.updateNotificationForHabit(habitUuid, config),
        onSuccess: (_, {habitUuid}) => {
            // Invalidate habit detail to get updated notification config
            queryClient.invalidateQueries({queryKey: habitKeys.detail(habitUuid)});
        },
    });
};

export const useDeleteNotificationForHabit = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (habitUuid: string) => notificationApi.deleteNotificationForHabit(habitUuid),
        onSuccess: (_, habitUuid) => {
            // Invalidate habit detail to get updated notification config
            queryClient.invalidateQueries({queryKey: habitKeys.detail(habitUuid)});
        },
    });
};

export const useAddNumberToModal = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({habitUuid, number}: { habitUuid: string; number: string }) =>
            habitNumberModalApi.addNumber(habitUuid, number),
        onSuccess: (_, {habitUuid}) => {
            queryClient.invalidateQueries({queryKey: numberModalKeys.habit(habitUuid)});
            queryClient.invalidateQueries({queryKey: habitKeys.detail(habitUuid)});
        },
    });
};

export const useRemoveNumberFromModal = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({habitUuid, number}: { habitUuid: string; number: string }) =>
            habitNumberModalApi.removeNumber(habitUuid, number),
        onSuccess: (_, {habitUuid}) => {
            queryClient.invalidateQueries({queryKey: numberModalKeys.habit(habitUuid)});
            queryClient.invalidateQueries({queryKey: habitKeys.detail(habitUuid)});
        },
    });
};

