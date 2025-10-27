import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {ApiHabitRead, ApiHabitRecordWrite, ApiHabitWrite, habitApi, habitRecordApi,} from '@/services/api';
import {challengeKeys} from "@/hooks/useChallenges";
import {userKeys} from "@/hooks/useUser";

export const habitKeys = {
    all: ['habits'] as const,
    lists: () => [...habitKeys.all, 'list'] as const,
    list: () => [...habitKeys.lists()] as const,
    details: () => [...habitKeys.all, 'detail'] as const,
    detail: (uuid: string) => [...habitKeys.details(), uuid] as const,
    percentageHistory: (uuid: string, month: Date) =>
        ['percentage-history', ...habitKeys.detail(uuid), month.toISOString()] as const,
    percentageHistoryComplete: (uuid: string) =>
        ['percentage-history', ...habitKeys.detail(uuid)] as const,
    connectedHabits: (uuid: string) => [...habitKeys.detail(uuid), 'connected'] as const,
    connectedHabitsCount: (uuid: string) => [...habitKeys.detail(uuid), 'connected-count'] as const,
    participants: (uuid: string) => [...habitKeys.detail(uuid), 'participants'] as const,
    records: (uuid: string) => [...habitKeys.detail(uuid), 'records'] as const,
    recordsDetail: (uuid: string) => [...habitKeys.detail(uuid), 'detailed-records'] as const,
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
    epochDayTo?: number,
) => {
    return useQuery({
        queryKey: [...habitKeys.records(habitUuid), epochDayFrom, epochDayTo],
        queryFn: () => habitRecordApi.getRecords(habitUuid, epochDayFrom, epochDayTo),
        enabled: !!habitUuid,
        staleTime: 1000 * 30,
    });
};

export const useHabitRecordsDetail = (
    habitUuid: string,
    epochDayFrom?: number,
    epochDayTo?: number,
) => {
    return useQuery({
        queryKey: [...habitKeys.recordsDetail(habitUuid), epochDayFrom, epochDayTo],
        queryFn: () => habitRecordApi.getRecords(habitUuid, epochDayFrom, epochDayTo),
        enabled: !!habitUuid,
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
            queryClient.setQueryData<ApiHabitRead[]>(
                habitKeys.list(),
                (old) => (old ? [...old, newHabit] : [newHabit])
            );
            queryClient.invalidateQueries({
                queryKey: habitKeys.lists(),
                refetchType: 'none'
            });
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
            queryClient.setQueryData(
                habitKeys.detail(updatedHabit.uuid),
                updatedHabit
            );

            queryClient.setQueryData<ApiHabitRead[]>(
                habitKeys.list(),
                (old) =>
                    old?.map((h) => (h.uuid === updatedHabit.uuid ? updatedHabit : h))
            );

            queryClient.invalidateQueries({
                queryKey: habitKeys.records(updatedHabit.uuid),
                refetchType: 'none'
            });

            queryClient.removeQueries({
                queryKey: habitKeys.recordsDetail(updatedHabit.uuid),
            });
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
            queryClient.setQueryData<ApiHabitRead[]>(
                habitKeys.list(),
                (old) => old?.filter((h) => h.uuid !== uuid)
            );

            queryClient.removeQueries({queryKey: habitKeys.detail(uuid)});

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
            queryClient.invalidateQueries({
                queryKey: habitKeys.lists(),
            });
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
            queryClient.invalidateQueries({
                queryKey: habitKeys.lists(),
            });
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
        mutationFn: ({habitUuid, record, isChallenge}: { habitUuid: string; record: ApiHabitRecordWrite, isChallenge: boolean}) =>
            habitRecordApi.createRecord(habitUuid, record),
        onSuccess: (_, {habitUuid, isChallenge}) => {
            queryClient.invalidateQueries({
                queryKey: habitKeys.recordsDetail(habitUuid),
                refetchType: 'none'
            })

            queryClient.invalidateQueries({
                queryKey: habitKeys.detail(habitUuid),
                refetchType: 'active'
            });

            queryClient.invalidateQueries({
                queryKey: habitKeys.lists(),
                refetchType: 'none'
            });

            queryClient.invalidateQueries({
                queryKey: [...habitKeys.percentageHistoryComplete(habitUuid)],
                refetchType: 'none'
            });

            if (isChallenge) {
                queryClient.invalidateQueries({
                    queryKey: challengeKeys.overview()
                })
            }
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
            queryClient.invalidateQueries({
                queryKey: habitKeys.participants(uuid),
            });
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
            queryClient.invalidateQueries({
                queryKey: habitKeys.participants(uuid),
            });
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
            queryClient.invalidateQueries({
                queryKey: habitKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: userKeys.invitations(),
            })
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
            queryClient.invalidateQueries({
                queryKey: habitKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: userKeys.invitations(),
            })
        },
    });
};
