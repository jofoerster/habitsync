import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {ApiHabitRead, ApiHabitRecordWrite, ApiHabitWrite, habitApi, habitRecordApi,} from '@/services/api';
import {challengeKeys} from "@/hooks/useChallenges";
import {userKeys} from "@/hooks/useUser";
import {SortHabitRequestBody} from "../services/api";

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
 * Uses optimistic updates for immediate UI feedback
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
        // Enable offline mutations for habit records
        networkMode: 'always',
        // Optimistic update for immediate UI feedback
        onMutate: async ({habitUuid, record, isChallenge, isDetailView}) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({queryKey: habitKeys.detail(habitUuid)});
            
            // Snapshot the previous value
            const previousHabit = queryClient.getQueryData<ApiHabitRead>(habitKeys.detail(habitUuid));
            
            // Optimistically update the habit
            if (previousHabit) {
                queryClient.setQueryData<ApiHabitRead>(habitKeys.detail(habitUuid), (old) => {
                    if (!old) return old;
                    
                    // Update or add the record
                    const existingRecordIndex = old.records.findIndex(r => r.epochDay === record.epochDay);
                    let updatedRecords = [...old.records];
                    
                    if (existingRecordIndex >= 0) {
                        // Update existing record - keep the completion as is, server will recalculate
                        updatedRecords[existingRecordIndex] = {
                            ...updatedRecords[existingRecordIndex],
                            recordValue: record.recordValue,
                        };
                    } else {
                        // Add new record with deterministic temporary ID
                        // IMPORTANT: This UUID format is intentionally deterministic (not random)
                        // - Format: __optimistic-{habitUuid}-{epochDay}
                        // - Same habit+day always generates same temp ID
                        // - Prevents duplicate records when mutation retries (offline/network issues)
                        // - Uses hyphens for UUID-safe formatting
                        // - Server replaces with real UUID on successful sync
                        // - Extremely unlikely to collide with real UUIDs (double underscore prefix)
                        updatedRecords.push({
                            uuid: `__optimistic-${habitUuid}-${record.epochDay}`,
                            habitUuid: habitUuid,
                            epochDay: record.epochDay,
                            recordValue: record.recordValue,
                            completion: 0, // Temporary status - server will recalculate based on habit config
                        });
                    }
                    
                    return {
                        ...old,
                        records: updatedRecords,
                    };
                });
            }
            
            return { previousHabit };
        },
        // If mutation fails, rollback
        onError: (err, variables, context) => {
            if (context?.previousHabit) {
                queryClient.setQueryData(
                    habitKeys.detail(variables.habitUuid),
                    context.previousHabit
                );
            }
        },
        onSuccess: ({habitUuid}, variables) => {
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
