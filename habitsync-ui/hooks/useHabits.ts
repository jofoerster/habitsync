import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {ApiHabitRead, ApiHabitRecordWrite, ApiHabitWrite, habitApi, habitRecordApi,} from '@/services/api';
import {challengeKeys} from "@/hooks/useChallenges";
import {userKeys} from "@/hooks/useUser";
import {SortHabitRequestBody} from "../services/api";
import {getEpochDay} from "@/util/util";
import {queryClient} from "@/context/ReactQueryContext";
import {useEffect} from "react";

export const habitKeys = {
    all: ['habits'] as const,
    lists: () => [...habitKeys.all, 'list'] as const,
    list: () => [...habitKeys.lists()] as const,
    uuidlists: () => [...habitKeys.all, 'list-uuid'] as const,
    uuidlist: () => [...habitKeys.list()] as const,
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
};

export const useHabitUuids = () => {
    return useQuery({
        queryKey: habitKeys.uuidlist(),
        queryFn: () => habitApi.getUserHabitUuids(),
        staleTime: 1000 * 60 * 5,
        refetchOnMount: 'always', // always refetch when component mounts
    });
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
    const query = useQuery({
        queryKey: habitKeys.detail(uuid),
        queryFn: () => habitApi.getHabitByUuid(uuid),
        enabled: enabled && !!uuid,
        staleTime: 1000 * 60 * 2,
    });

    useEffect(() => {
        if (query.data?.records) {
            queryClient.setQueryData(
                [...habitKeys.records(uuid), 'current'],
                query.data.records
            );
        }
    }, [query.data, uuid]);

    return query;
};

const twoDaysAgo = new Date();
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

export const useCurrentHabitRecords = (
    habitUuid: string,
) => {
    return useQuery({
        queryKey: [...habitKeys.records(habitUuid), 'current'],
        queryFn: () =>
            habitRecordApi.getRecords(habitUuid, getEpochDay(twoDaysAgo), getEpochDay(new Date())),
        enabled: !!habitUuid,
        staleTime: 1000 * 60 * 2,
        initialData: () => {
            const habit = queryClient.getQueryData<ApiHabitRead>(habitKeys.detail(habitUuid));
            return habit?.records;
        },
    });
};

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
export const useConnectedHabits = (uuid: string, enabled = false) => {
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

export const useHabitGroupNames = () => {
    return useQuery({
        queryKey: habitKeys.details(),
        queryFn: () => habitApi.getGroupNames(),
        staleTime: 1000 * 60 * 60,
        refetchOnMount: 'always',
    });
}

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
                queryKey: habitKeys.list(),
                refetchType: "none"
            })
            queryClient.invalidateQueries({queryKey: habitKeys.uuidlist()})
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
            queryClient.invalidateQueries({
                queryKey: habitKeys.detail(updatedHabit.uuid),
            });
            queryClient.invalidateQueries({
                queryKey: habitKeys.list(),
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
            queryClient.invalidateQueries({
                queryKey: habitKeys.list(),
            })
            queryClient.invalidateQueries({queryKey: habitKeys.uuidlist()})
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
                queryKey: habitKeys.list(),
            })
            queryClient.invalidateQueries({queryKey: habitKeys.uuidlist()})
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
                queryKey: habitKeys.list(),
            })
            queryClient.invalidateQueries({queryKey: habitKeys.uuidlist()})
        },
    });
};

/**
 * Sort habits (typically for groups)
 */
export const useSortHabits = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (body: SortHabitRequestBody) =>
            habitApi.sort(body),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: habitKeys.list(),
            })
            queryClient.invalidateQueries({queryKey: habitKeys.uuidlist()})
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
        mutationFn: ({habitUuid, record}: {
            habitUuid: string;
            record: ApiHabitRecordWrite,
            isChallenge: boolean,
            isDetailView: boolean,
        }) =>
            habitRecordApi.createRecord(habitUuid, record),
        onSuccess: ({habitUuid}, variables) => {
            console.log(`Updating cache for habit ${habitUuid} with new record`, variables.record);
            queryClient.setQueryData(
                [...habitKeys.records(habitUuid), 'current'],
                (old: any) => {
                    if (!old) return [variables.record];
                    const filtered = old.filter((r: any) => r.epochDay !== variables.record.epochDay);
                    return [...filtered, variables.record];
                }
            );

            if (variables.isDetailView) {
                queryClient.invalidateQueries({
                    queryKey: habitKeys.detail(habitUuid),
                })
            }
            if (variables.isChallenge) {
                queryClient.invalidateQueries({
                    queryKey: challengeKeys.overview(),
                    refetchType: 'active'
                });
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
