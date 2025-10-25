import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {ApiChallengeWrite, challengeApi,} from '@/services/api';

export const challengeKeys = {
    all: ['challenges'] as const,
    lists: () => [...challengeKeys.all, 'list'] as const,
    list: () => [...challengeKeys.lists()] as const,
    details: () => [...challengeKeys.all, 'detail'] as const,
    detail: (id: number) => [...challengeKeys.details(), id] as const,
    overview: () => [...challengeKeys.all, 'overview'] as const,
    habit: () => [...challengeKeys.all, 'habit'] as const,
};

export const useChallengeOverview = () => {
    return useQuery({
        queryKey: challengeKeys.overview(),
        queryFn: () => challengeApi.getCurrentChallengeOverview(),
        staleTime: 1000 * 60 * 2,
    });
};

export const useChallenges = () => {
    return useQuery({
        queryKey: challengeKeys.list(),
        queryFn: () => challengeApi.getChallengeList(),
        staleTime: 1000 * 60 * 5,
    });
};

export const useChallenge = (id: number, enabled = true) => {
    return useQuery({
        queryKey: challengeKeys.detail(id),
        queryFn: () => challengeApi.getChallengeById(id),
        enabled: enabled && id > 0,
        staleTime: 1000 * 60 * 2,
    });
};

export const useChallengeHabit = () => {
    return useQuery({
        queryKey: challengeKeys.habit(),
        queryFn: () => challengeApi.getChallengeHabit(),
        staleTime: 1000 * 60 * 5,
    });
};

export const useCreateChallenge = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (challenge: ApiChallengeWrite) => challengeApi.createChallenge(challenge),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: challengeKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: challengeKeys.overview(),
            });
        },
    });
};

export const useUpdateChallenge = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (challenge: ApiChallengeWrite) => challengeApi.updateChallenge(challenge),
        onSuccess: (updatedChallenge) => {
            if (updatedChallenge.id) {
                queryClient.setQueryData(challengeKeys.detail(updatedChallenge.id), updatedChallenge);
            }
            queryClient.invalidateQueries({
                queryKey: challengeKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: challengeKeys.overview(),
            });
        },
    });
};

export const useDeleteChallenge = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => challengeApi.deleteChallenge(id),
        onSuccess: (_, id) => {
            queryClient.removeQueries({queryKey: challengeKeys.detail(id)});
            queryClient.invalidateQueries({
                queryKey: challengeKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: challengeKeys.overview(),
            });
        },
    });
};

export const useProposeChallenge = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => challengeApi.proposeChallenge(id),
        onSuccess: (updatedChallenge) => {
            queryClient.setQueryData(challengeKeys.detail(updatedChallenge.id), updatedChallenge);
            queryClient.invalidateQueries({
                queryKey: challengeKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: challengeKeys.overview(),
            });
        },
    });
};

export const useVoteOnChallenge = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({id, vote}: { id: number; vote: boolean }) =>
            challengeApi.voteOnChallenge(id, vote),
        onSuccess: (updatedChallenge) => {
            queryClient.setQueryData(challengeKeys.detail(updatedChallenge.id), updatedChallenge);
            queryClient.invalidateQueries({
                queryKey: challengeKeys.overview(),
            });
        },
    });
};
