import { BACKEND_BASE_URL } from '@/public/config';
import auth from './auth';

export interface ApiHabitRead {
    uuid: string;
    account: ApiAccountRead;
    name: string;
    color: number;
    progressComputation: ApiComputationReadWrite;
    currentPercentage: number;
    currentMedal?: string;
    isChallengeHabit?: boolean;
    synchronizedSharedHabitId?: number;
    sortPosition: number;
    notificationFrequency: NotificationConfig | null;
}

export interface ApiAccountRead {
    displayName: string;
    authenticationId: string;
    email?: string;
}

export interface ApiAccountSettingsReadWrite {
    displayName: string;
    email: string;
    authenticationId: string; // identifier, cannot be changed
    isEmailNotificationsEnabled: boolean;
    isPushNotificationsEnabled: boolean;
    appriseTarget?: string;
    dailyNotificationHour: number;
}

export interface ApiComputationReadWrite {
    dailyGoal: number;
    dailyReachableValue: number;
    unit?: string;
    targetDays: number;
    frequencyType: FrequencyTypeDTO;
    frequency: number;
    timesPerXDays?: number;
    challengeComputationType?: ChallengeComputationType;
}

export enum FrequencyTypeDTO {
    WEEKLY = "WEEKLY",
    MONTHLY = "MONTHLY",
    X_TIMES_PER_Y_DAYS = "X_TIMES_PER_Y_DAYS",
    DAILY = "DAILY",
}

export enum ChallengeComputationType {
    RELATIVE = "RELATIVE",
    ABSOLUTE = "ABSOLUTE",
    MAX_VALUE = "MAX_VALUE"
}

export interface ApiHabitWrite {
    uuid?: string;
    name: string;
    color?: number;
    progressComputation: ApiComputationReadWrite;
}

export interface ApiHabitRecordRead {
    uuid: string;
    habitUuid: string;
    epochDay: number;
    recordValue: number;
    completion: HabitRecordCompletion;
}

export enum HabitRecordCompletion {
    MISSED,
    COMPLETED,
    PARTIALLY_COMPLETED,
    COMPLETED_BY_OTHER_RECORDS
}

export interface ApiHabitRecordWrite {
    epochDay: number;
    recordValue: number;
}

export interface ApiHabitNumberModalConfig {
    habitUuid: string;
    values: string[];
}

export interface ApiSharedHabitWrite {
    title: string;
    habitUuid?: string;
    description?: string;
    allowEditingOfAllUsers?: boolean;
    progressComputation: ApiComputationReadWrite;
}

export interface ApiSharedHabitRead {
    owner: ApiAccountRead;
    habits: ApiHabitRead[];
    shareCode: string;
    id: number;
    title: string;
    description: string;
    allowEditingOfAllUsers: boolean;
    creationTime: number;
    progressComputation: ApiComputationReadWrite;
}

export interface ApiSharedHabitMedalsRead {
    account: ApiAccountRead;
    medals: ApiMedalRead[];
}

export interface ApiMedalRead {
    asciiCode: string;
    amount: number;
    color: number;
}

export interface ApiChallengeRead {
    id: number;
    account: ApiAccountRead;
    status: ChallengeStatus;
    title: string;
    description: string;
    computation: ApiComputationReadWrite;
    startDay: number;
    endDay: number;
    votingScore: number;
    currentUserVote?: boolean;
}

export enum ChallengeStatus {
    CREATED = "CREATED", PROPOSED = "PROPOSED", ACTIVE = "ACTIVE", NOT_ACTIVE = "NOT_ACTIVE", COMPLETED = "COMPLETED"
}

export interface ApiChallengeWrite {
    challengeId?: number;
    title: string;
    description: string;
    computation: ApiComputationReadWrite;
}

export interface ApiChallengeOverviewRead {
    activeChallenge: ApiChallengeRead;
    proposedChallenges: ApiChallengeRead[];
    createdChallenges: ApiChallengeRead[];
    leaderboard: ApiLeaderBoardEntryRead[];
    progressCurrentChallengeUsers: ApiChallengeProgressRead[];
}

export interface ApiLeaderBoardEntryRead {
    account: ApiAccountRead;
    points: number;
}

export interface ApiChallengeProgressRead {
    account: ApiAccountRead;
    linkToHabit: string;
    percentage: number;
    maxValue: number;
    absoluteValue: number;
}

export interface SupportedOIDCIssuer {
    name: string;
    url: string;
    clientId: string;
    clientSecret?: string;
    scopes?: string[];
}

export interface SupportedOIDCIssuers {
    supportedIssuers: SupportedOIDCIssuer[];
    allowBasicAuth: boolean;
}

export interface JWTTokenPair {
    accessToken: string;
    refreshToken: string;
}

export interface NotificationConfig {
    frequency: 'daily' | 'weekly';
    weekdays: string[];
    time: string;
    appriseTarget?: string;
}

export interface ServerConfig {
    appriseActive: boolean;
}

// API service functions

// User API
export const userApi = {
    getUserInfo: async (): Promise<ApiAccountRead> => {
        const response = await authenticatedFetch(`${BACKEND_BASE_URL}/user/info`);
        if (!response.ok) throw new Error('Failed to fetch user info');
        return response.json();
    },

    getUserSettings: async (): Promise<ApiAccountSettingsReadWrite> => {
        const response = await authenticatedFetch(`${BACKEND_BASE_URL}/user/settings`);
        if (!response.ok) throw new Error('Failed to fetch user settings');
        return response.json();
    },

    updateUserSettings: async (settings: ApiAccountSettingsReadWrite): Promise<ApiAccountSettingsReadWrite> => {
        const response = await authenticatedFetch(`${BACKEND_BASE_URL}/user/settings`, {
            method: 'PUT',
            body: JSON.stringify(settings),
        });
        if (!response.ok) throw new Error('Failed to update user settings');
        return response.json();
    },

    getUnapprovedUsers: async (): Promise<ApiAccountRead[]> => {
        const response = await authenticatedFetch(`${BACKEND_BASE_URL}/user/unapproved-accounts`);
        if (!response.ok) throw new Error('Failed to fetch unapproved users');
        return response.json();
    },

    approveUser: async (accountUuid: string): Promise<void> => {
        const response = await authenticatedFetch(`${BACKEND_BASE_URL}/user/approve-account/${accountUuid}`, {
            method: 'PUT',
        });
        if (!response.ok) throw new Error('Failed to approve user');
    },
}


// Habit API
export const habitApi = {
    getUserHabits: async (): Promise<ApiHabitRead[]> => {
        const response = await authenticatedFetch(`${BACKEND_BASE_URL}/habit/list`);
        if (!response.ok) throw new Error('Failed to fetch habits');
        return response.json();
    },

    getHabitByUuid: async (uuid: string): Promise<ApiHabitRead> => {
        const response = await authenticatedFetch(`${BACKEND_BASE_URL}/habit/${uuid}`);
        if (!response.ok) throw new Error('Failed to fetch habit');
        return response.json();
    },

    createHabit: async (habit: ApiHabitWrite): Promise<ApiHabitRead> => {
        const response = await authenticatedFetch(`${BACKEND_BASE_URL}/habit`, {
            method: 'POST',
            body: JSON.stringify(habit),
        });
        if (!response.ok) throw new Error('Failed to create habit');
        return response.json();
    },

    updateHabit: async (habit: ApiHabitWrite): Promise<ApiHabitRead> => {
        const response = await authenticatedFetch(`${BACKEND_BASE_URL}/habit/${habit.uuid}`, {
            method: 'PUT',
            body: JSON.stringify(habit),
        });
        if (!response.ok) throw new Error('Failed to update habit');
        return response.json();
    },

    deleteHabit: async (uuid: string): Promise<void> => {
        const response = await authenticatedFetch(`${BACKEND_BASE_URL}/habit/${uuid}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete habit');
    },

    getConnectedHabits: async (uuid: string): Promise<ApiHabitRead[]> => {
        const response = await authenticatedFetch(`${BACKEND_BASE_URL}/habit/connected-habits/${uuid}`);
        if (!response.ok) throw new Error('Failed to fetch connected habits');
        return response.json();
    },

    getConnectedHabitCount: async (uuid: string): Promise<number> => {
        const response = await authenticatedFetch(`${BACKEND_BASE_URL}/habit/connected-habits/${uuid}/count`)
        if (!response.ok) throw new Error('Failed to fetch connected habits count');
        return response.json();
    },

    moveHabitUp: async (uuid: string): Promise<void> => {
        const response = await authenticatedFetch(`${BACKEND_BASE_URL}/habit/${uuid}/sort-position/move-up`, {
            method: 'POST',
        });
        if (!response.ok) throw new Error('Failed to move habit up');
    },

    moveHabitDown: async (uuid: string): Promise<void> => {
        const response = await authenticatedFetch(`${BACKEND_BASE_URL}/habit/${uuid}/sort-position/move-down`, {
            method: 'POST',
        });
        if (!response.ok) throw new Error('Failed to move habit down');
    }
};

export const notificationApi = {
    updateNotificationForHabit: async (habitUuid: string, frequency: NotificationConfig): Promise<void> => {
        const response = await authenticatedFetch(`${BACKEND_BASE_URL}/notifications/habit/${habitUuid}`, {
            method: 'PUT',
            body: JSON.stringify(frequency),
        });
        if (!response.ok) throw new Error('Failed to update notification for habit');
    },

    deleteNotificationForHabit: async (habitUuid: string): Promise<void> => {
        const response = await authenticatedFetch(`${BACKEND_BASE_URL}/notifications/habit/${habitUuid}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete notification for habit');
    }
}

export const habitNumberModalApi = {
    addNumber: async (habitUuid: string, number: string): Promise<void> => {
        const response = await authenticatedFetch(`${BACKEND_BASE_URL}/habitNumberModalConfig/${habitUuid}/add/${number}`, {
            method: 'POST',
        });
        if (!response.ok) throw new Error('Failed to add number to modal');
        return;
    },

    removeNumber: async (habitUuid: string, number: string): Promise<void> => {
        const response = await authenticatedFetch(`${BACKEND_BASE_URL}/habitNumberModalConfig/${habitUuid}/remove/${number}`, {
            method: 'POST',
        });
        if (!response.ok) throw new Error('Failed to remove number from modal');
        return;
    },

    getNumberModal: async (habitUuid: string): Promise<ApiHabitNumberModalConfig> => {
        const response = await authenticatedFetch(`${BACKEND_BASE_URL}/habitNumberModalConfig/${habitUuid}`);
        if (!response.ok) throw new Error('Failed to fetch number modal config');
        return response.json();
    }
}

// Habit Record API
export const habitRecordApi = {
    getRecords: async (habitUuid: string, epochDayFrom?: number, epochDayTo?: number): Promise<ApiHabitRecordRead[]> => {
        let url = `${BACKEND_BASE_URL}/record/${habitUuid}`;
        if (epochDayFrom !== undefined || epochDayTo !== undefined) {
            url += '?';
            if (epochDayFrom !== undefined) url += `epochDayFrom=${epochDayFrom}`;
            if (epochDayFrom !== undefined && epochDayTo !== undefined) url += '&';
            if (epochDayTo !== undefined) url += `epochDayTo=${epochDayTo}`;
        }
        const response = await authenticatedFetch(url);
        if (!response.ok) throw new Error('Failed to fetch records');
        return response.json();
    },

    createRecord: async (habitUuid: string, record: ApiHabitRecordWrite): Promise<ApiHabitRecordRead> => {
        const response = await authenticatedFetch(`${BACKEND_BASE_URL}/record/${habitUuid}`, {
            method: 'POST',
            body: JSON.stringify(record),
        });
        if (!response.ok) throw new Error('Failed to create record');
        return response.json();
    },
};

// Shared Habit API
export const sharedHabitApi = {
    getAllUserSharedHabits: async (): Promise<ApiSharedHabitRead[]> => {
        const response = await authenticatedFetch(`${BACKEND_BASE_URL}/shared-habit/list`);
        if (!response.ok) throw new Error('Failed to fetch shared habits');
        return response.json();
    },

    getSharedHabitByShareCode: async (shareCode: string): Promise<ApiSharedHabitRead> => {
        const response = await authenticatedFetch(`${BACKEND_BASE_URL}/shared-habit/${shareCode}`);
        if (!response.ok) throw new Error('Failed to fetch shared habit');
        return response.json();
    },

    createSharedHabit: async (sharedHabit: ApiSharedHabitWrite): Promise<ApiSharedHabitRead> => {
        const response = await authenticatedFetch(`${BACKEND_BASE_URL}/shared-habit`, {
            method: 'POST',
            body: JSON.stringify(sharedHabit),
        });
        if (!response.ok) throw new Error('Failed to create shared habit');
        return response.json();
    },

    updateSharedHabit: async (sharedHabit: ApiSharedHabitWrite, shareCode: string): Promise<ApiSharedHabitRead> => {
        const response = await authenticatedFetch(`${BACKEND_BASE_URL}/shared-habit/${shareCode}`, {
            method: 'PUT',
            body: JSON.stringify(sharedHabit),
        });
        if (!response.ok) throw new Error('Failed to update shared habit');
        return response.json();
    },

    deleteSharedHabit: async (sharedHabit: ApiSharedHabitWrite, shareCode: string): Promise<void> => {
        const response = await authenticatedFetch(`${BACKEND_BASE_URL}/shared-habit/${shareCode}`, {
            method: 'DELETE',
            body: JSON.stringify(sharedHabit),
        });
        if (!response.ok) throw new Error('Failed to delete shared habit');
    },

    joinSharedHabit: async (shareCode: string, habitUuid?: string): Promise<ApiSharedHabitRead> => {
        const url = habitUuid
            ? `${BACKEND_BASE_URL}/shared-habit/join/${shareCode}?habitUuid=${habitUuid}`
            : `${BACKEND_BASE_URL}/shared-habit/join/${shareCode}`;

        const response = await authenticatedFetch(url, {
            method: 'POST',
        });
        if (!response.ok) throw new Error('Failed to join shared habit');
        return response.json();
    },

    updateLinkToSharedHabit: async (shareCode: string, habitUuid?: string): Promise<ApiSharedHabitRead> => {
        const url = habitUuid
            ? `${BACKEND_BASE_URL}/shared-habit/join/${shareCode}?habitUuid=${habitUuid}`
            : `${BACKEND_BASE_URL}/shared-habit/join/${shareCode}`;

        const response = await authenticatedFetch(url, {
            method: 'PUT',
        });
        if (!response.ok) throw new Error('Failed to update link to shared habit');
        return response.json();
    },

    leaveSharedHabit: async (shareCode: string): Promise<void> => {
        const response = await authenticatedFetch(`${BACKEND_BASE_URL}/shared-habit/leave/${shareCode}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to leave shared habit');
    },

    getMedalsForSharedHabit: async (shareCode: string): Promise<ApiSharedHabitMedalsRead[]> => {
        const response = await authenticatedFetch(`${BACKEND_BASE_URL}/shared-habit/${shareCode}/medals`);
        if (!response.ok) throw new Error('Failed to fetch medals for shared habit');
        return response.json();
    }
};

// Challenge API
export const challengeApi = {
    getCurrentChallengeOverview: async (): Promise<ApiChallengeOverviewRead> => {
        const response = await authenticatedFetch(`${BACKEND_BASE_URL}/challenge/overview`);
        if (!response.ok) throw new Error('Failed to fetch challenge overview');
        return response.json();
    },

    getChallengeList: async (): Promise<ApiChallengeRead[]> => {
        const response = await authenticatedFetch(`${BACKEND_BASE_URL}/challenge/list`);
        if (!response.ok) throw new Error('Failed to fetch challenges');
        return response.json();
    },

    getChallengeById: async (id: number): Promise<ApiChallengeRead> => {
        const response = await authenticatedFetch(`${BACKEND_BASE_URL}/challenge/${id}`);
        if (!response.ok) throw new Error('Failed to fetch challenge');
        return response.json();
    },

    createChallenge: async (challenge: ApiChallengeWrite): Promise<ApiChallengeRead> => {
        const response = await authenticatedFetch(`${BACKEND_BASE_URL}/challenge`, {
            method: 'POST',
            body: JSON.stringify(challenge),
        });
        if (!response.ok) throw new Error('Failed to create challenge');
        return response.json();
    },

    updateChallenge: async (challenge: ApiChallengeWrite): Promise<ApiChallengeRead> => {
        const response = await authenticatedFetch(`${BACKEND_BASE_URL}/challenge`, {
            method: 'PUT',
            body: JSON.stringify(challenge),
        });
        if (!response.ok) throw new Error('Failed to update challenge');
        return response.json();
    },

    deleteChallenge: async (id: number): Promise<void> => {
        const response = await authenticatedFetch(`${BACKEND_BASE_URL}/challenge/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete challenge');
    },

    proposeChallenge: async (id: number): Promise<ApiChallengeRead> => {
        const response = await authenticatedFetch(`${BACKEND_BASE_URL}/challenge/${id}/propose`, {
            method: 'POST',
        });
        if (!response.ok) throw new Error('Failed to propose challenge');
        return response.json();
    },

    voteOnChallenge: async (id: number, vote: boolean): Promise<ApiChallengeRead> => {
        const response = await authenticatedFetch(`${BACKEND_BASE_URL}/challenge/${id}/vote?vote=${vote}`, {
            method: 'POST',
        });
        if (!response.ok) throw new Error('Failed to vote on challenge');
        return response.json();
    },

    getChallengeHabit: async (): Promise<ApiHabitRead> => {
        const response = await authenticatedFetch(`${BACKEND_BASE_URL}/challenge/challenge-habit`);
        if (!response.ok) throw new Error('Failed to fetch habit');
        return response.json();
    },
};

// Auth API
export const authApi = {
    getUserInfo: async (): Promise<any> => {
        console.log('Fetching user info');
        const response = await authenticatedFetch(`${BACKEND_BASE_URL}/auth/status`)
        if (!response.ok) throw new Error('Failed to fetch user info');
        return response.json();
    },

    getSupportedOIDCIssuers: async (): Promise<SupportedOIDCIssuers> => {
        const response = await fetch(`${BACKEND_BASE_URL}/auth/supported-issuers`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) throw new Error('Failed to fetch login methods');
        return response.json();
    },

    getTokenPair: async (accessToken: string): Promise<JWTTokenPair> => {
        const response = await fetch(`${BACKEND_BASE_URL}/user/refresh-token`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });
        if (!response.ok) throw new Error('Failed to refresh token');
        return response.json();
    },

    getTokenPairFromRefreshToken: async (refreshToken: string): Promise<JWTTokenPair> => {
        const response = await fetch(`${BACKEND_BASE_URL}/auth/refresh-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({refreshToken}),
        });
        if (!response.ok) throw new Error('Failed to refresh token with provided refresh token');
        return response.json();
    },

    getTokenPairFromUsernamePassword: async (username: string, password: string): Promise<JWTTokenPair> => {
        const credentials = btoa(`${username}:${password}`);
        const response = await fetch(`${BACKEND_BASE_URL}/user/refresh-token`, {
            headers: {
                'Authorization': `Basic ${credentials}`,
            }
        });
        if (!response.ok) throw new Error('Failed to authenticate with username and password');
        return response.json();
    }
};

export const serverConfigApi = {
    getServerConfig: async (): Promise<ServerConfig> => {
        const response = await authenticatedFetch(`${BACKEND_BASE_URL}/config`);
        if (!response.ok) throw new Error('Failed to fetch server config');
        return response.json();
    }
}

const getAuthHeaders = async (): Promise<HeadersInit> => {
    const accessToken = await auth.getAccessToken();
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    if (accessToken && accessToken.length > 0) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return headers;
};

const authenticatedFetch = async (url: string, options: RequestInit = {}, alreadyRetried = false): Promise<Response> => {
    const headers = await getAuthHeaders();
    const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
            ...headers,
            ...options.headers,
        },
    });

    if (response.status === 401 && !alreadyRetried) {
        console.log('Unauthorized, attempting token refresh');

        const refreshSuccess = await auth.refresh();
        if (refreshSuccess) {
            console.log('Token refreshed successfully, retrying request');
            return await authenticatedFetch(url, options, true);
        }
    }

    return response;
};
