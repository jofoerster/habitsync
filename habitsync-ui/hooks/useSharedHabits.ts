import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {ApiSharedHabitWrite, sharedHabitApi,} from '@/services/api';

export const sharedHabitKeys = {
    all: ['sharedHabits'] as const,
    lists: () => [...sharedHabitKeys.all, 'list'] as const,
    list: () => [...sharedHabitKeys.lists()] as const,
    details: () => [...sharedHabitKeys.all, 'detail'] as const,
    detail: (shareCode: string) => [...sharedHabitKeys.details(), shareCode] as const,
    medals: (shareCode: string) => [...sharedHabitKeys.detail(shareCode), 'medals'] as const,
};

export const useSharedHabits = () => {
    return useQuery({
        queryKey: sharedHabitKeys.list(),
        queryFn: () => sharedHabitApi.getAllUserSharedHabits(),
        staleTime: 1000 * 60 * 5,
    });
};

export const useSharedHabit = (shareCode: string, enabled = true) => {
    return useQuery({
        queryKey: sharedHabitKeys.detail(shareCode),
        queryFn: () => sharedHabitApi.getSharedHabitByShareCode(shareCode),
        enabled: enabled && !!shareCode,
        staleTime: 1000 * 60 * 2,
    });
};

export const useSharedHabitMedals = (shareCode: string, enabled = true) => {
    return useQuery({
        queryKey: sharedHabitKeys.medals(shareCode),
        queryFn: () => sharedHabitApi.getMedalsForSharedHabit(shareCode),
        enabled: enabled && !!shareCode,
        staleTime: 1000 * 60 * 5,
    });
};

export const useCreateSharedHabit = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (sharedHabit: ApiSharedHabitWrite) =>
            sharedHabitApi.createSharedHabit(sharedHabit),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: sharedHabitKeys.lists()});
        },
    });
};

export const useUpdateSharedHabit = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({sharedHabit, shareCode}: { sharedHabit: ApiSharedHabitWrite; shareCode: string }) =>
            sharedHabitApi.updateSharedHabit(sharedHabit, shareCode),
        onSuccess: (updatedHabit, {shareCode}) => {
            queryClient.setQueryData(sharedHabitKeys.detail(shareCode), updatedHabit);
            queryClient.invalidateQueries({queryKey: sharedHabitKeys.lists()});
        },
    });
};

export const useDeleteSharedHabit = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({sharedHabit, shareCode}: { sharedHabit: ApiSharedHabitWrite; shareCode: string }) =>
            sharedHabitApi.deleteSharedHabit(sharedHabit, shareCode),
        onSuccess: (_, {shareCode}) => {
            queryClient.removeQueries({queryKey: sharedHabitKeys.detail(shareCode)});
            queryClient.invalidateQueries({queryKey: sharedHabitKeys.lists()});
        },
    });
};

export const useJoinSharedHabit = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({shareCode, habitUuid}: { shareCode: string; habitUuid?: string }) =>
            sharedHabitApi.joinSharedHabit(shareCode, habitUuid),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: sharedHabitKeys.lists()});
        },
    });
};

export const useUpdateLinkToSharedHabit = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({shareCode, habitUuid}: { shareCode: string; habitUuid?: string }) =>
            sharedHabitApi.updateLinkToSharedHabit(shareCode, habitUuid),
        onSuccess: (_, {shareCode}) => {
            queryClient.invalidateQueries({queryKey: sharedHabitKeys.detail(shareCode)});
            queryClient.invalidateQueries({queryKey: sharedHabitKeys.lists()});
        },
    });
};

export const useLeaveSharedHabit = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (shareCode: string) => sharedHabitApi.leaveSharedHabit(shareCode),
        onSuccess: (_, shareCode) => {
            queryClient.removeQueries({queryKey: sharedHabitKeys.detail(shareCode)});
            queryClient.invalidateQueries({queryKey: sharedHabitKeys.lists()});
        },
    });
};

