import * as AuthSession from 'expo-auth-session';
import {DiscoveryDocument} from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import {SupportedOIDCIssuer} from "@/services/api";
import {secureStorage} from "@/services/storage";

WebBrowser.maybeCompleteAuthSession();

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
            if (!provider.clientId) {
                return {type: 'error', error: `Client ID not configured for ${provider.name}`};
            }

            const redirectUri = this.getRedirectUri();
            const discovery = await this.getDiscoveryDocument(provider);

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

            const result = await request.promptAsync(discovery);

            return this.handleAuthResult(result, request, discovery, provider);

        } catch (error) {
            console.error('OAuth login error:', error);
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
        if (result.type === 'success') {
            try {
                const tokenExchangeParams = {
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

                const tokenResponse = await AuthSession.exchangeCodeAsync(
                    tokenExchangeParams,
                    discovery
                );

                return {
                    type: 'success',
                    accessToken: tokenResponse.accessToken,
                    refreshToken: tokenResponse.refreshToken,
                    idToken: tokenResponse.idToken,
                    tokenResponse,
                };
            } catch (error) {
                console.error('Token exchange error:', error);
                return {
                    type: 'error',
                    error: error instanceof Error ? error.message : 'Token exchange failed',
                };
            }
        } else if (result.type === 'cancel') {
            return {type: 'cancel'};
        } else {
            return {
                type: 'error',
                error: 'Authentication failed',
            };
        }
    }

    private getRedirectUri(): string {
        return AuthSession.makeRedirectUri({
            scheme: 'habitsync',
            path: 'auth-callback',
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
