import OAuthService from './oauth';
import {ApiAccountRead, authApi, SupportedOIDCIssuer, userApi} from './api';
import {secureStorage} from "@/services/storage";

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_INFO_KEY = 'user_info';

export interface AuthState {
    isLoading: boolean;
    isAuthenticated: boolean;
    isApproved: boolean;
    userInfo: any | null;
    error: string | null;
    isRefreshing: boolean;
}

export class AuthService {
    private static instance: AuthService;
    private state: AuthState = {
        isLoading: true,
        isAuthenticated: false,
        isApproved: false,
        userInfo: null,
        error: null,
        isRefreshing: false,
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
        const refreshToken = await secureStorage.getItem(REFRESH_TOKEN_KEY);

        if (!refreshToken) {
            console.log("No refresh token found");
            this.setState({
                isLoading: false,
                isAuthenticated: false,
                isApproved: false,
                userInfo: null,
                error: null,
                isRefreshing: false,
            });
            return false;
        }

        try {
            const response = await authApi.getTokenPairFromRefreshToken(refreshToken);
            await this.setTokens(response.accessToken, response.refreshToken);

            const userInfo = await authApi.getUserInfo();
            await secureStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));

            this.setState({
                isLoading: false,
                isAuthenticated: userInfo?.authenticated || false,
                isApproved: userInfo?.approved || false,
                userInfo: userInfo || null,
                error: null,
                isRefreshing: false,
            });
            return true;
        } catch (error) {
            console.error('Auth initialization failed:', error);
            await this.clearAuth();
            return false;
        }
    }

    public async updateUserInfo(): Promise<void> {
        const userInfo = await authApi.getUserInfo();
        // Store user info for future optimistic loads
        await secureStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));

        this.setState({
            isLoading: false,
            isAuthenticated: userInfo?.authenticated || false,
            isApproved: userInfo?.approved || false,
            userInfo: userInfo || null,
            error: null,
            isRefreshing: false,
        });
    }

    private async _performInitialization(): Promise<void> {
        const accessToken = await secureStorage.getItem(ACCESS_TOKEN_KEY);
        const refreshToken = await secureStorage.getItem(REFRESH_TOKEN_KEY);
        const storedUserInfo = await secureStorage.getItem(USER_INFO_KEY);

        if (accessToken && refreshToken) {
            const userInfo = storedUserInfo ? JSON.parse(storedUserInfo) : null;
            this.setState({
                isLoading: false,
                isAuthenticated: true,
                isApproved: userInfo?.approved ?? true,
                userInfo: userInfo,
                error: null,
                isRefreshing: true,
            });

            this.refreshInBackground();
        } else {
            this.setState({
                isLoading: false,
                isAuthenticated: false,
                isApproved: false,
                userInfo: null,
                error: null,
                isRefreshing: false,
            });
        }
    }

    private async refreshInBackground(): Promise<void> {
        try {
            const success = await this.refresh();
            if (!success) {
                console.log('Background refresh failed, clearing auth state');
            }
        } catch (error) {
            console.error('Background refresh error:', error);
            await this.clearAuth();
        } finally {
            this.setState({ isRefreshing: false });
        }
    }

    public async loginWithOAuth2Provider(provider: SupportedOIDCIssuer, redirectPath?: string): Promise<void> {
        this.setState({isLoading: true, error: null, isRefreshing: false});

        try {
            const result = await OAuthService.loginWithOAuthProvider(provider, redirectPath);

            if (result.type === 'success') {
                const tokenPair = await authApi.getTokenPair(result.idToken || result.accessToken || '');
                await this.setTokens(tokenPair.accessToken, tokenPair.refreshToken);

                const userInfo = await authApi.getUserInfo();
                await secureStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));

                this.setState({
                    isLoading: false,
                    isAuthenticated: userInfo?.authenticated || false,
                    isApproved: userInfo?.approved || false,
                    userInfo: userInfo || null,
                    error: null,
                    isRefreshing: false,
                });
            } else if (result.type === 'cancel') {
                console.log('[Auth] OAuth redirect initiated (web platform)');
            } else {
                this.setState({
                    isLoading: false,
                    error: result.error || 'Login failed',
                    isRefreshing: false,
                });
            }
        } catch (error) {
            console.error('OAuth2 login error:', error);
            this.setState({
                isLoading: false,
                error: error instanceof Error ? error.message : 'Login failed',
                isRefreshing: false,
            });
        }
    }

    public async loginWithUsernamePassword(username: string, password: string, redirectPath?: string): Promise<void> {
        this.setState({isLoading: true, error: null, isRefreshing: false});

        try {
            const tokenPair = await authApi.getTokenPairFromUsernamePassword(username, password);

            await this.setTokens(tokenPair.accessToken, tokenPair.refreshToken);

            const userInfo = await authApi.getUserInfo();
            await secureStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));

            this.setState({
                isLoading: false,
                isAuthenticated: userInfo?.authenticated || false,
                isApproved: userInfo?.approved || false,
                userInfo: userInfo || null,
                error: null,
                isRefreshing: false,
            });
            console.log("Successfully logged in with username/password");

        } catch (error) {
            console.error('Username/password login error:', error);
            this.setState({
                isLoading: false,
                error: error instanceof Error ? error.message : 'Login failed',
                isRefreshing: false,
            });
        }
    }

    public async logout(): Promise<void> {
        await this.clearAuth();
    }

    private async clearAuth(): Promise<void> {
        console.log('Clearing auth');
        await secureStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_INFO_KEY]);
        this.setState({
            isLoading: false,
            isAuthenticated: false,
            isApproved: false,
            userInfo: null,
            error: null,
            isRefreshing: false,
        });
    }

    public async getAccessToken(): Promise<string | null> {
        return await secureStorage.getItem(ACCESS_TOKEN_KEY);
    }

    public async setTokens(accessToken: string, refreshToken: string): Promise<void> {
        await secureStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        await secureStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }


    public getState(): AuthState {
        return this.state;
    }

    public async getCurrentUser(): Promise<ApiAccountRead | null> {
        const info = await secureStorage.getItem(USER_INFO_KEY);
        if (info) {
            return JSON.parse(info);
        } else {
            const userInfoFromApi = await userApi.getUserInfo();
            await secureStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfoFromApi));
            return userInfoFromApi;
        }
    }

    public subscribe(listener: (state: AuthState) => void): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private setState(newState: Partial<AuthState>): void {
        this.state = {...this.state, ...newState};
        this.listeners.forEach(listener => listener(this.state));
    }
}

export default AuthService.getInstance();