import {SupportedOIDCIssuer} from "@/services/api";
import {Platform} from 'react-native';

export interface AuthResult {
    type: 'success' | 'error' | 'cancel';
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
    error?: string;
}

export class WebOAuthService {
    private static instance: WebOAuthService;

    private constructor() {}

    public static getInstance(): WebOAuthService {
        if (!WebOAuthService.instance) {
            WebOAuthService.instance = new WebOAuthService();
        }
        return WebOAuthService.instance;
    }

    private generateRandomString(length: number): string {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
        const randomValues = new Uint8Array(length);
        crypto.getRandomValues(randomValues);
        return Array.from(randomValues)
            .map(x => charset[x % charset.length])
            .join('');
    }

    private async generateCodeChallenge(verifier: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(verifier);
        const hash = await crypto.subtle.digest('SHA-256', data);

        return btoa(String.fromCharCode(...new Uint8Array(hash)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }

    private storeOAuthState(state: string, codeVerifier: string, provider: string, redirectPath: string): void {
        const stateData = {
            state,
            codeVerifier,
            provider,
            redirectPath,
            timestamp: Date.now(),
        };
        sessionStorage.setItem('oauth_state', JSON.stringify(stateData));
        console.log('[WebOAuth] Stored OAuth state in sessionStorage');
    }

    private getOAuthState(): { state: string; codeVerifier: string; provider: string; redirectPath: string } | null {
        try {
            const stateJson = sessionStorage.getItem('oauth_state');
            if (!stateJson) {
                console.log('[WebOAuth] No OAuth state found in sessionStorage');
                return null;
            }

            const stateData = JSON.parse(stateJson);

            const age = Date.now() - stateData.timestamp;
            if (age > 10 * 60 * 1000) {
                console.log('[WebOAuth] OAuth state expired');
                sessionStorage.removeItem('oauth_state');
                return null;
            }

            return stateData;
        } catch (error) {
            console.error('[WebOAuth] Failed to retrieve OAuth state:', error);
            return null;
        }
    }

    private clearOAuthState(): void {
        sessionStorage.removeItem('oauth_state');
        console.log('[WebOAuth] Cleared OAuth state');
    }

    private async fetchDiscoveryDocument(provider: SupportedOIDCIssuer): Promise<any> {
        if (!provider.url) {
            throw new Error(`Provider URL not configured for ${provider.name}`);
        }

        try {
            const cacheKey = `discovery-${provider.name}`;
            const cached = sessionStorage.getItem(cacheKey);
            if (cached) {
                const cachedData = JSON.parse(cached);
                if (cachedData.authorizationEndpoint && cachedData.tokenEndpoint) {
                    console.log('[WebOAuth] Using cached discovery document');
                    return cachedData;
                }
            }

            const discoveryUrl = provider.url.endsWith('/.well-known/openid-configuration')
                ? provider.url
                : `${provider.url}/.well-known/openid-configuration`;

            console.log('[WebOAuth] Fetching discovery document from:', discoveryUrl);

            const response = await fetch(discoveryUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch discovery document: ${response.status}`);
            }

            const discovery = await response.json();

            sessionStorage.setItem(cacheKey, JSON.stringify(discovery));

            return discovery;

        } catch (error) {
            console.error('[WebOAuth] Failed to fetch discovery document:', error);
            throw error;
        }
    }

    private async getProviders(): Promise<SupportedOIDCIssuer[]> {
        const {authApi} = await import('./api');
        const loginOptions = await authApi.getLoginOptions();
        return loginOptions.supportedIssuers || [];
    }

    async loginWithOAuthProvider(
        provider: SupportedOIDCIssuer,
        redirectPath?: string
    ): Promise<AuthResult> {
        if (Platform.OS !== 'web') {
            return {
                type: 'error',
                error: 'WebOAuthService is only for web platform',
            };
        }

        try {
            console.log('[WebOAuth] Starting OAuth login with provider:', provider.name);

            if (!provider.clientId) {
                return {type: 'error', error: `Client ID not configured for ${provider.name}`};
            }

            const discovery = await this.fetchDiscoveryDocument(provider);
            console.log('[WebOAuth] Discovery document fetched', discovery);
            if (!discovery.authorization_endpoint) {
                return {type: 'error', error: 'Authorization endpoint not found'};
            }

            const codeVerifier = this.generateRandomString(128);
            const codeChallenge = await this.generateCodeChallenge(codeVerifier);
            const state = this.generateRandomString(32);

            this.storeOAuthState(state, codeVerifier, provider.name, redirectPath || '/');

            const redirectUri = `${window.location.origin}/auth-callback`;
            console.log("Redirect url: ", redirectUri)
            const scopes = ['openid', 'profile', 'email', ...(provider.scopes || [])].join(' ');

            const authUrl = new URL(discovery.authorization_endpoint);
            authUrl.searchParams.set('client_id', provider.clientId);
            authUrl.searchParams.set('response_type', 'code');
            authUrl.searchParams.set('redirect_uri', redirectUri);
            authUrl.searchParams.set('scope', scopes);
            authUrl.searchParams.set('state', state);
            authUrl.searchParams.set('code_challenge', codeChallenge);
            authUrl.searchParams.set('code_challenge_method', 'S256');

            console.log('[WebOAuth] Redirecting to authorization endpoint:', authUrl.origin);
            console.log('[WebOAuth] Redirect URI:', redirectUri);
            console.log('[WebOAuth] State:', state);

            window.location.href = authUrl.toString();

            return {type: 'cancel'};

        } catch (error) {
            console.error('[WebOAuth] Login error:', error);
            return {
                type: 'error',
                error: error instanceof Error ? error.message : 'Unknown OAuth error',
            };
        }
    }

    /**
     * Handle OAuth callback after redirect from authorization server
     */
    async handleCallback(): Promise<AuthResult> {
        if (Platform.OS !== 'web') {
            return {
                type: 'error',
                error: 'WebOAuthService is only for web platform',
            };
        }

        try {
            console.log('[WebOAuth] Handling OAuth callback');
            console.log('[WebOAuth] Current URL:', window.location.href);

            const params = new URLSearchParams(window.location.search);
            const code = params.get('code');
            const state = params.get('state');
            const error = params.get('error');
            const errorDescription = params.get('error_description');

            if (error) {
                console.error('[WebOAuth] Error from provider:', error, errorDescription);
                this.clearOAuthState();
                return {
                    type: 'error',
                    error: errorDescription || error || 'Authorization failed',
                };
            }

            if (!code) {
                console.error('[WebOAuth] No authorization code in callback');
                return {
                    type: 'error',
                    error: 'No authorization code received',
                };
            }

            const storedState = this.getOAuthState();
            if (!storedState) {
                console.error('[WebOAuth] No stored OAuth state found');
                return {
                    type: 'error',
                    error: 'OAuth state not found. Please try logging in again.',
                };
            }

            if (state !== storedState.state) {
                console.error('[WebOAuth] State mismatch');
                this.clearOAuthState();
                return {
                    type: 'error',
                    error: 'Invalid state parameter. Possible CSRF attack.',
                };
            }

            console.log('[WebOAuth] State verified successfully');

            const providers = await this.getProviders();
            const provider = providers.find(p => p.name === storedState.provider);
            if (!provider) {
                console.error('[WebOAuth] Provider not found:', storedState.provider);
                this.clearOAuthState();
                return {
                    type: 'error',
                    error: 'Provider configuration not found',
                };
            }

            const discovery = await this.fetchDiscoveryDocument(provider);
            const tokenResult = await this.exchangeCodeForTokens(
                code,
                storedState.codeVerifier,
                provider,
                discovery.token_endpoint!
            );

            this.clearOAuthState();

            return tokenResult;

        } catch (error) {
            console.error('[WebOAuth] Callback handling error:', error);
            this.clearOAuthState();
            return {
                type: 'error',
                error: error instanceof Error ? error.message : 'Failed to handle OAuth callback',
            };
        }
    }

    private async exchangeCodeForTokens(
        code: string,
        codeVerifier: string,
        provider: SupportedOIDCIssuer,
        tokenEndpoint: string
    ): Promise<AuthResult> {
        try {
            console.log('[WebOAuth] Exchanging code for tokens');

            const redirectUri = `${window.location.origin}/auth-callback`;

            const body = new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirectUri,
                client_id: provider.clientId!,
                code_verifier: codeVerifier,
            });

            // Add client secret if provided (for Google workaround)
            if (provider.clientSecret) {
                body.append('client_secret', provider.clientSecret);
            }

            console.log('[WebOAuth] Token endpoint:', tokenEndpoint);

            const response = await fetch(tokenEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: body.toString(),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[WebOAuth] Token exchange failed:', response.status, errorText);
                throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
            }

            const tokens = await response.json();
            console.log('[WebOAuth] Token exchange successful');

            return {
                type: 'success',
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                idToken: tokens.id_token,
            };

        } catch (error) {
            console.error('[WebOAuth] Token exchange error:', error);
            return {
                type: 'error',
                error: error instanceof Error ? error.message : 'Token exchange failed',
            };
        }
    }
}

export default WebOAuthService.getInstance();
