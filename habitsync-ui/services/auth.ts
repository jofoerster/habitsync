import AsyncStorage from '@react-native-async-storage/async-storage';
import OAuthService, {AuthResult} from './oauth';
import {ApiAccountRead, authApi, SupportedOIDCIssuer, userApi} from './api';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_INFO_KEY = 'user_info';

export interface AuthState {
    isLoading: boolean;
    isAuthenticated: boolean;
    isApproved: boolean;
    userInfo: any | null;
    error: string | null;
}

export class AuthService {
    private static instance: AuthService;
    private state: AuthState = {
        isLoading: false,
        isAuthenticated: false,
        isApproved: false,
        userInfo: null,
        error: null,
    };
    private listeners: ((state: AuthState) => void)[] = [];
    private hasInitialized = false;
    private initializationPromise: Promise<void> | null = null;
    private isInitializing = false;

    private constructor() {
        this.initialize().catch(console.error);
    }

    public static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    public async initialize(): Promise<void> {
        if (this.hasInitialized) {
            console.log("Auth already initialized, skipping");
            return;
        }

        if (this.isInitializing) {
            console.log("Auth initialization in progress, waiting...");
            if (this.initializationPromise) {
                return this.initializationPromise;
            }
        }

        console.log("Initializing auth service");
        this.isInitializing = true;
        this.hasInitialized = true;

        this.initializationPromise = this._performInitialization();

        try {
            await this.initializationPromise;
        } finally {
            this.isInitializing = false;
            this.initializationPromise = null;
        }
    }

    public async refresh(): Promise<boolean> {
        const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);

        if (!refreshToken) {
            console.log("No refresh token found");
            this.setState({
                isLoading: false,
                isAuthenticated: false,
                isApproved: false,
                userInfo: null,
                error: null
            });
            return false;
        }

        try {
            const response = await authApi.getTokenPairFromRefreshToken(refreshToken);
            await this.setTokens(response.accessToken, response.refreshToken);

            const userInfo = await authApi.getUserInfo();
            this.setState({
                isLoading: false,
                isAuthenticated: userInfo?.authenticated || false,
                isApproved: userInfo?.approved || false,
                userInfo: userInfo || null,
                error: null,
            });
            return true;
        } catch (error) {
            console.error('Auth initialization failed:', error);
            await this.clearAuth();
            return false;
        }
    }

    private async _performInitialization(): Promise<void> {
        this.setState({ isLoading: true });
        await this.refresh();
    }

    public async loginWithOAuth2Provider(provider: SupportedOIDCIssuer, redirectPath?: string): Promise<void> {
        this.setState({ isLoading: true, error: null });

        try {
            const result = await OAuthService.loginWithOAuthProvider(provider, redirectPath);

            if (result.type === 'success') {
                const tokenPair = await authApi.getTokenPair(result.idToken || result.accessToken || '');
                await this.setTokens(tokenPair.accessToken, tokenPair.refreshToken);

                const userInfo = await authApi.getUserInfo();
                this.setState({
                    isLoading: false,
                    isAuthenticated: userInfo?.authenticated || false,
                    isApproved: userInfo?.approved || false,
                    userInfo: userInfo || null,
                    error: null,
                });
            } else {
                this.setState({
                    isLoading: false,
                    error: result.error || 'Login failed',
                });
            }
        } catch (error) {
            console.error('OAuth2 login error:', error);
            this.setState({
                isLoading: false,
                error: error instanceof Error ? error.message : 'Login failed',
            });
        }
    }

    public async logout(): Promise<void> {
        await this.clearAuth();
    }

    private async clearAuth(): Promise<void> {
        console.log('Clearing auth');
        await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_INFO_KEY]);
        this.setState({
            isLoading: false,
            isAuthenticated: false,
            isApproved: false,
            userInfo: null,
            error: null,
        });
    }

    public async getAccessToken(): Promise<string | null> {
        return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    }

    private async setTokens(accessToken: string, refreshToken: string): Promise<void> {
        await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }


    public getState(): AuthState {
        return this.state;
    }

    public async getCurrentUser(): Promise<ApiAccountRead | null> {
        const info = await AsyncStorage.getItem(USER_INFO_KEY);
        if (info) {
            return JSON.parse(info);
        }
        return null;
    }

    public subscribe(listener: (state: AuthState) => void): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private setState(newState: Partial<AuthState>): void {
        this.state = { ...this.state, ...newState };
        this.listeners.forEach(listener => listener(this.state));
    }
}

export default AuthService.getInstance();