import * as AuthSession from 'expo-auth-session';
import {DiscoveryDocument} from 'expo-auth-session';
import {SupportedOIDCIssuer} from "@/services/api";
import {secureStorage} from "@/services/storage";

export interface AuthResult {
    type: 'success' | 'error' | 'cancel';
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
    error?: string;
    tokenResponse?: AuthSession.TokenResponse;
}

export class OAuthService {
    private static instance: OAuthService;
    private discoveryCache = new Map<string, DiscoveryDocument>();

    private constructor() {
    }

    public static getInstance(): OAuthService {
        if (!OAuthService.instance) {
            OAuthService.instance = new OAuthService();
        }
        return OAuthService.instance;
    }

    async loginWithOAuthProvider(
        provider: SupportedOIDCIssuer,
        redirectPath?: string
    ): Promise<AuthResult> {
        try {
            console.log('[OAuth] Starting login with provider:', provider.name);

            if (!provider.clientId) {
                return {type: 'error', error: `Client ID not configured for ${provider.name}`};
            }

            const redirectUri = this.getRedirectUri();
            console.log('[OAuth] Redirect URI:', redirectUri);

            const discovery = await this.getDiscoveryDocument(provider);
            console.log('[OAuth] Discovery endpoints:', {
                auth: discovery.authorizationEndpoint,
                token: discovery.tokenEndpoint
            });

            const request = new AuthSession.AuthRequest({
                clientId: provider.clientId,
                scopes: ['openid', 'profile', 'email', ...(provider.scopes || [])],
                redirectUri,
                responseType: AuthSession.ResponseType.Code,
                state: JSON.stringify({
                    redirectPath: redirectPath || '/',
                    provider: provider.name,
                }),
                usePKCE: true,
            });

            console.log('[OAuth] Calling promptAsync, waiting for user authentication...');
            const result = await request.promptAsync(discovery);
            console.log('[OAuth] promptAsync completed with type:', result.type);

            return this.handleAuthResult(result, request, discovery, provider);

        } catch (error) {
            console.error('[OAuth] Login error:', error);
            return {
                type: 'error',
                error: error instanceof Error ? error.message : 'Unknown OAuth error',
            };
        }
    }

    private async handleAuthResult(
        result: AuthSession.AuthSessionResult,
        request: AuthSession.AuthRequest,
        discovery: AuthSession.DiscoveryDocument,
        provider: SupportedOIDCIssuer
    ): Promise<AuthResult> {
        console.log('[OAuth] Handling auth result, type:', result.type);

        if (result.type === 'success') {
            console.log('[OAuth] Success! Has code:', !!result.params?.code);
            try {
                const tokenExchangeParams: any = {
                    clientId: request.clientId,
                    code: result.params.code,
                    redirectUri: request.redirectUri,
                    extraParams: {
                        code_verifier: request.codeVerifier || '',
                    },
                };

                if (provider.clientSecret) {
                    tokenExchangeParams.clientSecret = provider.clientSecret;
                }

                console.log('[OAuth] Exchanging code for tokens...');
                const tokenResponse = await AuthSession.exchangeCodeAsync(
                    tokenExchangeParams,
                    discovery
                );

                console.log('[OAuth] Token exchange successful, has accessToken:', !!tokenResponse.accessToken);
                return {
                    type: 'success',
                    accessToken: tokenResponse.accessToken,
                    refreshToken: tokenResponse.refreshToken,
                    idToken: tokenResponse.idToken,
                    tokenResponse,
                };
            } catch (error) {
                console.error('[OAuth] Token exchange error:', error);
                return {
                    type: 'error',
                    error: error instanceof Error ? error.message : 'Token exchange failed',
                };
            }
        } else if (result.type === 'cancel') {
            console.log('[OAuth] User cancelled authentication');
            return {type: 'cancel'};
        } else if (result.type === 'dismiss') {
            console.log('[OAuth] Auth session was dismissed (browser closed or timed out)');
            console.log('[OAuth] Result details:', JSON.stringify(result, null, 2));
            return {
                type: 'error',
                error: 'Authentication was dismissed. The browser window may have closed unexpectedly.',
            };
        } else if (result.type === 'error') {
            console.error('[OAuth] Auth error from provider:', result.params);
            return {
                type: 'error',
                error: result.params?.error_description || result.params?.error || 'Authentication error from provider',
            };
        } else {
            console.log('[OAuth] Unexpected result type:', result.type);
            console.log('[OAuth] Full result:', JSON.stringify(result, null, 2));
            return {
                type: 'error',
                error: `Authentication failed. Result type: ${result.type}. Please check console logs for details.`,
            };
        }
    }

    private getRedirectUri(): string {
        return AuthSession.makeRedirectUri({
            scheme: 'habitsync',
            path: 'auth-callback',
            preferLocalhost: false,
            isTripleSlashed: true,
        });
    }

    private async getDiscoveryDocument(provider: SupportedOIDCIssuer): Promise<DiscoveryDocument> {
        if (!provider.url) {
            throw new Error(`Provider URL not configured for ${provider.name}`);
        }

        if (this.discoveryCache.has(provider.name)) {
            return this.discoveryCache.get(provider.name)!;
        }

        try {
            const cachedData = await secureStorage.getItem(`discovery-${provider.name}`);
            if (cachedData) {
                const cachedDiscovery = JSON.parse(cachedData);
                if (cachedDiscovery.authorizationEndpoint && cachedDiscovery.tokenEndpoint) {
                    this.discoveryCache.set(provider.name, cachedDiscovery);
                    return cachedDiscovery;
                }
            }
        } catch (error) {
            console.warn('Failed to read cached discovery document:', error);
        }

        const discovery = await AuthSession.fetchDiscoveryAsync(provider.url);

        this.discoveryCache.set(provider.name, discovery);
        try {
            await secureStorage.setItem(`discovery-${provider.name}`, JSON.stringify(discovery));
        } catch (error) {
            console.warn('Failed to cache discovery document:', error);
        }

        return discovery;
    }
}

export default OAuthService.getInstance();
