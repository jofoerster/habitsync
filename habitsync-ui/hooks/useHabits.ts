import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {ApiHabitRead, ApiHabitRecordWrite, ApiHabitWrite, habitApi, habitRecordApi,} from '@/services/api';
import {challengeKeys} from "@/hooks/useChallenges";

export const habitKeys = {
    all: ['habits'] as const,
    lists: () => [...habitKeys.all, 'list'] as const,
    list: () => [...habitKeys.lists()] as const,
    details: () => [...habitKeys.all, 'detail'] as const,
    detail: (uuid: string) => [...habitKeys.details(), uuid] as const,
    percentageHistory: (uuid: string, month: Date) =>
        [...habitKeys.detail(uuid), 'percentage-history', month.toISOString()] as const,
    connectedHabits: (uuid: string) => [...habitKeys.detail(uuid), 'connected'] as const,
    connectedHabitsCount: (uuid: string) => [...habitKeys.detail(uuid), 'connected-count'] as const,
    participants: (uuid: string) => [...habitKeys.detail(uuid), 'participants'] as const,
    records: (uuid: string) => [...habitKeys.detail(uuid), 'records'] as const,
};

export const useHabits = () => {
    return useQuery({
        queryKey: habitKeys.list(),
        queryFn: () => habitApi.getUserHabits(),
        staleTime: 1000 * 60 * 5,
        refetchOnMount: 'always', // always refetch when component mounts
    });
};

/**
 * Get a single habit by UUID
 * Use this for habit detail screens
 */
export const useHabit = (uuid: string, enabled = true) => {
    return useQuery({
        queryKey: habitKeys.detail(uuid),
        queryFn: () => habitApi.getHabitByUuid(uuid),
        enabled: enabled && !!uuid,
        staleTime: 1000 * 60 * 2,
    });
};

/**
 * Get percentage history for a habit
 */
export const useHabitPercentageHistory = (uuid: string, month: Date) => {
    return useQuery({
        queryKey: habitKeys.percentageHistory(uuid, month),
        queryFn: () => habitApi.getHabitPercentageHistory(uuid, month),
        enabled: !!uuid,
        staleTime: 1000 * 60 * 5,
    });
};

/**
 * Get connected habits
 */
export const useConnectedHabits = (uuid: string, enabled = true) => {
    return useQuery({
        queryKey: habitKeys.connectedHabits(uuid),
        queryFn: () => habitApi.getConnectedHabits(uuid),
        enabled: enabled && !!uuid,
        staleTime: 1000 * 60 * 5,
    });
};

/**
 * Get connected habits count
 */
export const useConnectedHabitsCount = (uuid: string, enabled = true) => {
    return useQuery({
        queryKey: habitKeys.connectedHabitsCount(uuid),
        queryFn: () => habitApi.getConnectedHabitCount(uuid),
        enabled: enabled && !!uuid,
        staleTime: 1000 * 60 * 5,
    });
};

/**
 * Get habit participants
 */
export const useHabitParticipants = (uuid?: string) => {
    return useQuery({
        queryKey: habitKeys.participants(uuid!),
        queryFn: () => habitApi.listParticipants(uuid!),
        enabled: !!uuid,
        staleTime: 1000 * 60 * 2,
    });
};

/**
 * Get habit records
 */
export const useHabitRecords = (
    habitUuid: string,
    epochDayFrom?: number,
    epochDayTo?: number
) => {
    return useQuery({
        queryKey: [...habitKeys.records(habitUuid), epochDayFrom, epochDayTo],
        queryFn: () => habitRecordApi.getRecords(habitUuid, epochDayFrom, epochDayTo),
        enabled: !!habitUuid,
        staleTime: 1000 * 30,
    });
};

/**
 * Create a new habit
 * Automatically invalidates habit list cache
 */
export const useCreateHabit = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (habit: ApiHabitWrite) => habitApi.createHabit(habit),
        onSuccess: (newHabit) => {
            // Add the new habit to the cache optimistically
            queryClient.setQueryData<ApiHabitRead[]>(
                habitKeys.list(),
                (old) => (old ? [...old, newHabit] : [newHabit])
            );
            // Invalidate to refetch with correct sort position
            queryClient.invalidateQueries({queryKey: habitKeys.lists()});
        },
    });
};

/**
 * Update an existing habit
 * Automatically updates both list and detail caches
 */
export const useUpdateHabit = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (habit: ApiHabitWrite) => habitApi.updateHabit(habit),
        onSuccess: (updatedHabit) => {
            // Update the specific habit in cache
            queryClient.setQueryData(
                habitKeys.detail(updatedHabit.uuid),
                updatedHabit
            );

            // Update the habit in the list cache
            queryClient.setQueryData<ApiHabitRead[]>(
                habitKeys.list(),
                (old) =>
                    old?.map((h) => (h.uuid === updatedHabit.uuid ? updatedHabit : h))
            );
        },
    });
};

/**
 * Delete a habit
 * Automatically removes from cache
 */
export const useDeleteHabit = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (uuid: string) => habitApi.deleteHabit(uuid),
        onSuccess: (_, uuid) => {
            // Remove from list cache
            queryClient.setQueryData<ApiHabitRead[]>(
                habitKeys.list(),
                (old) => old?.filter((h) => h.uuid !== uuid)
            );

            // Remove detail cache
            queryClient.removeQueries({queryKey: habitKeys.detail(uuid)});

            // Remove all related queries
            queryClient.removeQueries({queryKey: habitKeys.records(uuid)});
            queryClient.removeQueries({queryKey: habitKeys.connectedHabits(uuid)});
        },
    });
};

/**
 * Move habit up in sort order
 */
export const useMoveHabitUp = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (uuid: string) => habitApi.moveHabitUp(uuid),
        onSuccess: () => {
            // Invalidate list to get new sort order
            queryClient.invalidateQueries({queryKey: habitKeys.lists()});
        },
    });
};

/**
 * Move habit down in sort order
 */
export const useMoveHabitDown = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (uuid: string) => habitApi.moveHabitDown(uuid),
        onSuccess: () => {
            // Invalidate list to get new sort order
            queryClient.invalidateQueries({queryKey: habitKeys.lists()});
        },
    });
};

/**
 * Create a habit record
 * Automatically invalidates habit and records caches
 */
export const useCreateHabitRecord = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({habitUuid, record}: { habitUuid: string; record: ApiHabitRecordWrite }) =>
            habitRecordApi.createRecord(habitUuid, record),
        onSuccess: (_, {habitUuid}) => {
            // Invalidate the habit detail (to update percentage)
            queryClient.invalidateQueries({queryKey: habitKeys.detail(habitUuid)});

            // Invalidate habit list (percentages might have changed)
            queryClient.invalidateQueries({queryKey: habitKeys.lists()});

            // Invalidate records
            queryClient.invalidateQueries({queryKey: habitKeys.records(habitUuid)});

            // Invalidate percentage history
            queryClient.invalidateQueries({
                queryKey: [...habitKeys.detail(habitUuid), 'percentage-history']
            });

            // Invalidate challenge view
            queryClient.invalidateQueries({
                queryKey: challengeKeys.overview()
            })
        },
    });
};

/**
 * Invite participant to habit
 */
export const useInviteParticipant = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({uuid, authId}: { uuid: string; authId: string }) =>
            habitApi.inviteParticipant(uuid, authId),
        onSuccess: (_, {uuid}) => {
            queryClient.invalidateQueries({queryKey: habitKeys.participants(uuid)});
        },
    });
};

/**
 * Remove participant from habit
 */
export const useRemoveParticipant = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({uuid, authId}: { uuid: string; authId: string }) =>
            habitApi.removeParticipant(uuid, authId),
        onSuccess: (_, {uuid}) => {
            queryClient.invalidateQueries({queryKey: habitKeys.participants(uuid)});
        },
    });
};

/**
 * Accept habit invitation
 */
export const useAcceptHabitInvitation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (uuid: string) => habitApi.acceptInvitation(uuid),
        onSuccess: () => {
            // Invalidate habit list since user now has a new habit
            queryClient.invalidateQueries({queryKey: habitKeys.lists()});
        },
    });
};

/**
 * Decline habit invitation
 */
export const useDeclineHabitInvitation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (uuid: string) => habitApi.declineInvitation(uuid),
        onSuccess: () => {
            // Invalidate in case UI needs to update
            queryClient.invalidateQueries({queryKey: habitKeys.lists()});
        },
    });
};
